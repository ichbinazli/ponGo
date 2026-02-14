import { FastifyRequest, FastifyReply } from 'fastify';
import { userModel } from '../models/user.model.js';
import { sessionModel } from '../models/session.model.js';
import {
    OAuthProvider,
    isProviderConfigured,
    getAuthorizationUrl,
    handleOAuthCallback,
    generateOAuthState,
} from '../services/oauth.service.js';
import {
    generateTokenPair,
    getRefreshTokenExpiry,
    generateRandomToken,
} from '../services/jwt.service.js';
import { hashToken } from '../services/hash.service.js';
import { successResponse, errorResponse, ErrorCodes } from '../utils/response.js';
import { env } from '../config/env.js';

// Store OAuth states temporarily (in production, use Redis)
const oauthStates = new Map<string, { provider: OAuthProvider; expiresAt: number; linkUserId?: number }>();

// Clean up expired states periodically
setInterval(() => {
    const now = Date.now();
    for (const [state, data] of oauthStates) {
        if (data.expiresAt < now) {
            oauthStates.delete(state);
        }
    }
}, 60000); // Every minute

/**
 * Get available OAuth providers
 */
export const getProviders = async (
    _request: FastifyRequest,
    reply: FastifyReply
): Promise<void> => {
    const providers: { name: string; id: OAuthProvider; enabled: boolean }[] = [
        { name: '42', id: '42', enabled: isProviderConfigured('42') },
    ];

    return reply.send(
        successResponse({
            providers: providers.filter((p) => p.enabled),
        })
    );
};

/**
 * Initiate OAuth flow
 */
export const initiateOAuth = async (
    request: FastifyRequest<{ Params: { provider: string } }>,
    reply: FastifyReply
): Promise<void> => {
    try {
        const provider = request.params.provider as OAuthProvider;

        // Validate provider
        if (provider !== '42') {
            return reply.status(400).send(
                errorResponse(ErrorCodes.VALIDATION_ERROR, 'Invalid OAuth provider')
            );
        }

        // Check if provider is configured
        if (!isProviderConfigured(provider)) {
            return reply.status(400).send(
                errorResponse(ErrorCodes.VALIDATION_ERROR, `${provider} OAuth is not configured`)
            );
        }

        // Generate state for CSRF protection
        const state = generateOAuthState();

        // Store state with expiry (10 minutes)
        oauthStates.set(state, {
            provider,
            expiresAt: Date.now() + 10 * 60 * 1000,
        });

        // Get authorization URL
        const authUrl = getAuthorizationUrl(provider, state);

        return reply.send(
            successResponse({
                authUrl,
                state,
            })
        );
    } catch (error) {
        request.log.error(error);
        return reply.status(500).send(
            errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to initiate OAuth')
        );
    }
};

/**
 * Handle OAuth callback
 */
export const oauthCallback = async (
    request: FastifyRequest<{
        Params: { provider: string };
        Querystring: { code?: string; state?: string; error?: string };
    }>,
    reply: FastifyReply
): Promise<void> => {
    try {
        const { code, state, error: oauthError } = request.query;
        const provider = request.params.provider as OAuthProvider;

        // Check for OAuth error
        if (oauthError) {
            return reply.status(400).send(
                errorResponse(ErrorCodes.VALIDATION_ERROR, `OAuth error: ${oauthError}`)
            );
        }

        // Validate required parameters
        if (!code || !state) {
            return reply.status(400).send(
                errorResponse(ErrorCodes.VALIDATION_ERROR, 'Missing code or state parameter')
            );
        }

        // Validate state
        const storedState = oauthStates.get(state);
        if (!storedState || storedState.provider !== provider) {
            return reply.status(400).send(
                errorResponse(ErrorCodes.VALIDATION_ERROR, 'Invalid or expired state')
            );
        }

        // Remove used state
        oauthStates.delete(state);

        // Check if expired
        if (storedState.expiresAt < Date.now()) {
            return reply.status(400).send(
                errorResponse(ErrorCodes.VALIDATION_ERROR, 'OAuth session expired')
            );
        }

        // Get user profile from OAuth provider
        const profile = await handleOAuthCallback(provider, code);

        // Check if user exists with this OAuth
        let user = userModel.findByOAuth(provider, profile.id);

        // If linking to existing account
        if (storedState.linkUserId) {
            if (user && user.id !== storedState.linkUserId) {
                return reply.status(409).send(
                    errorResponse(ErrorCodes.ALREADY_EXISTS, 'This OAuth account is already linked to another user')
                );
            }

            // Link OAuth to existing user
            userModel.update(storedState.linkUserId, {
                oauth_provider: provider,
                oauth_id: profile.id,
            });

            user = userModel.findById(storedState.linkUserId);

            return reply.send(
                successResponse({
                    message: 'OAuth account linked successfully',
                    user: {
                        id: user!.id,
                        email: user!.email,
                        display_name: user!.display_name,
                        avatar_url: user!.avatar_url,
                    },
                })
            );
        }

        // If user doesn't exist, check email
        if (!user) {
            user = userModel.findByEmail(profile.email);
        }

        // If user exists with email, link OAuth
        if (user && !user.oauth_provider) {
            userModel.update(user.id, {
                oauth_provider: provider,
                oauth_id: profile.id,
            });
        }

        // If no user exists, create new one
        if (!user) {
            // Generate unique display name if taken
            let displayName = profile.displayName.replace(/[^a-zA-Z0-9_-]/g, '_');
            if (displayName.length < 3) displayName = `user_${displayName}`;
            if (displayName.length > 32) displayName = displayName.substring(0, 32);

            let suffix = 1;
            let uniqueName = displayName;
            while (userModel.displayNameExists(uniqueName)) {
                uniqueName = `${displayName.substring(0, 28)}_${suffix}`;
                suffix++;
            }

            user = userModel.create({
                email: profile.email,
                display_name: uniqueName,
                avatar_url: profile.avatarUrl || 'default-avatar.png',
                oauth_provider: provider,
                oauth_id: profile.id,
            });
        }

        // Generate tokens
        const refreshToken = generateRandomToken();
        const refreshTokenHash = await hashToken(refreshToken);
        const expiresAt = getRefreshTokenExpiry();

        // Extract user agent and IP
        const userAgent = request.headers['user-agent'] || 'unknown';
        const ipAddress = request.ip || 'unknown';

        // Create session
        sessionModel.create({
            user_id: user.id,
            refresh_token_hash: refreshTokenHash,
            user_agent: userAgent,
            ip_address: ipAddress,
            expires_at: expiresAt.toISOString(),
        });

        // Generate JWT tokens
        const tokens = generateTokenPair(request.server, user);

        // Update user online status
        userModel.setOnlineStatus(user.id, true);

        // Redirect to frontend with tokens (or return JSON based on Accept header)
        const acceptJson = request.headers.accept?.includes('application/json');

        if (acceptJson) {
            return reply.send(
                successResponse({
                    user: {
                        id: user.id,
                        email: user.email,
                        display_name: user.display_name,
                        avatar_url: user.avatar_url,
                        two_factor_enabled: user.two_factor_enabled === 1,
                    },
                    tokens: {
                        accessToken: tokens.accessToken,
                        refreshToken,
                        expiresAt: tokens.accessTokenExpiresAt.toISOString(),
                    },
                    isNewUser: !user.password_hash,
                })
            );
        }

        // Redirect to frontend with token in URL fragment
        const frontendUrl = env.corsOrigin;
        const redirectUrl = `${frontendUrl}/auth/callback#access_token=${tokens.accessToken}&refresh_token=${refreshToken}`;

        return reply.redirect(redirectUrl);
    } catch (error) {
        request.log.error(error);

        // Redirect to frontend with error
        const frontendUrl = env.corsOrigin;
        const errorMessage = error instanceof Error ? error.message : 'OAuth authentication failed';

        if (request.headers.accept?.includes('application/json')) {
            return reply.status(500).send(
                errorResponse(ErrorCodes.INTERNAL_ERROR, errorMessage)
            );
        }

        return reply.redirect(`${frontendUrl}/auth/error?message=${encodeURIComponent(errorMessage)}`);
    }
};

/**
 * Link OAuth to existing account (authenticated)
 */
export const linkOAuth = async (
    request: FastifyRequest<{ Params: { provider: string } }>,
    reply: FastifyReply
): Promise<void> => {
    try {
        const userId = request.user.id;
        const provider = request.params.provider as OAuthProvider;

        // Validate provider
        if (provider !== '42') {
            return reply.status(400).send(
                errorResponse(ErrorCodes.VALIDATION_ERROR, 'Invalid OAuth provider')
            );
        }

        // Check if provider is configured
        if (!isProviderConfigured(provider)) {
            return reply.status(400).send(
                errorResponse(ErrorCodes.VALIDATION_ERROR, `${provider} OAuth is not configured`)
            );
        }

        // Check if user already has OAuth linked
        const user = userModel.findById(userId);
        if (user?.oauth_provider) {
            return reply.status(400).send(
                errorResponse(ErrorCodes.ALREADY_EXISTS, 'Account already has OAuth linked')
            );
        }

        // Generate state for CSRF protection
        const state = generateOAuthState();

        // Store state with user ID for linking
        oauthStates.set(state, {
            provider,
            expiresAt: Date.now() + 10 * 60 * 1000,
            linkUserId: userId,
        });

        // Get authorization URL
        const authUrl = getAuthorizationUrl(provider, state);

        return reply.send(
            successResponse({
                authUrl,
                state,
            })
        );
    } catch (error) {
        request.log.error(error);
        return reply.status(500).send(
            errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to initiate OAuth linking')
        );
    }
};

/**
 * Unlink OAuth from account (authenticated)
 */
export const unlinkOAuth = async (
    request: FastifyRequest,
    reply: FastifyReply
): Promise<void> => {
    try {
        const userId = request.user.id;

        const user = userModel.findById(userId);
        if (!user) {
            return reply.status(404).send(
                errorResponse(ErrorCodes.NOT_FOUND, 'User not found')
            );
        }

        // Check if user has password (need at least one auth method)
        if (!user.password_hash) {
            return reply.status(400).send(
                errorResponse(
                    ErrorCodes.VALIDATION_ERROR,
                    'Cannot unlink OAuth without a password set'
                )
            );
        }

        // Check if OAuth is linked
        if (!user.oauth_provider) {
            return reply.status(400).send(
                errorResponse(ErrorCodes.VALIDATION_ERROR, 'No OAuth account linked')
            );
        }

        // Unlink OAuth
        userModel.update(userId, {
            oauth_provider: undefined,
            oauth_id: undefined,
        });

        return reply.send(
            successResponse(null, 'OAuth account unlinked')
        );
    } catch (error) {
        request.log.error(error);
        return reply.status(500).send(
            errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to unlink OAuth')
        );
    }
};
