import { env } from '../config/env.js';

/**
 * OAuth provider types
 */
export type OAuthProvider = 'google' | 'github' | '42';

/**
 * OAuth user profile from provider
 */
export interface OAuthProfile {
    provider: OAuthProvider;
    id: string;
    email: string;
    displayName: string;
    avatarUrl?: string;
}

/**
 * OAuth token response
 */
interface OAuthTokenResponse {
    access_token: string;
    token_type: string;
    scope?: string;
    expires_in?: number;
}

/**
 * Google user info response
 */
interface GoogleUserInfo {
    id: string;
    email: string;
    verified_email: boolean;
    name: string;
    given_name?: string;
    family_name?: string;
    picture?: string;
}

/**
 * GitHub user info response
 */
interface GitHubUserInfo {
    id: number;
    login: string;
    name: string | null;
    email: string | null;
    avatar_url: string;
}

/**
 * GitHub email response
 */
interface GitHubEmail {
    email: string;
    primary: boolean;
    verified: boolean;
}

/**
 * 42 user info response
 */
interface FortyTwoUserInfo {
    id: number;
    email: string;
    login: string;
    displayname: string;
    image?: {
        link?: string;
        versions?: {
            medium?: string;
            small?: string;
        };
    };
}

/**
 * Check if OAuth provider is configured
 */
export const isProviderConfigured = (provider: OAuthProvider): boolean => {
    switch (provider) {
        case 'google':
            return !!(env.oauth.google.clientId && env.oauth.google.clientSecret);
        case 'github':
            return !!(env.oauth.github.clientId && env.oauth.github.clientSecret);
        case '42':
            return !!(env.oauth.fortyTwo?.clientId && env.oauth.fortyTwo?.clientSecret);
        default:
            return false;
    }
};

/**
 * Get OAuth authorization URL
 */
export const getAuthorizationUrl = (provider: OAuthProvider, state: string): string => {
    switch (provider) {
        case 'google':
            return buildGoogleAuthUrl(state);
        case 'github':
            return buildGitHubAuthUrl(state);
        case '42':
            return buildFortyTwoAuthUrl(state);
        default:
            throw new Error(`Unknown OAuth provider: ${provider}`);
    }
};

/**
 * Build Google authorization URL
 */
const buildGoogleAuthUrl = (state: string): string => {
    const params = new URLSearchParams({
        client_id: env.oauth.google.clientId!,
        redirect_uri: env.oauth.google.callbackUrl!,
        response_type: 'code',
        scope: 'openid email profile',
        state,
        access_type: 'offline',
        prompt: 'consent',
    });
    return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
};

/**
 * Build GitHub authorization URL
 */
const buildGitHubAuthUrl = (state: string): string => {
    const params = new URLSearchParams({
        client_id: env.oauth.github.clientId!,
        redirect_uri: env.oauth.github.callbackUrl!,
        scope: 'user:email read:user',
        state,
    });
    return `https://github.com/login/oauth/authorize?${params}`;
};

/**
 * Build 42 authorization URL
 */
const buildFortyTwoAuthUrl = (state: string): string => {
    const params = new URLSearchParams({
        client_id: env.oauth.fortyTwo?.clientId!,
        redirect_uri: env.oauth.fortyTwo?.callbackUrl!,
        response_type: 'code',
        scope: 'public',
        state,
    });
    return `https://api.intra.42.fr/oauth/authorize?${params}`;
};

/**
 * Exchange authorization code for tokens and get user profile
 */
export const handleOAuthCallback = async (
    provider: OAuthProvider,
    code: string
): Promise<OAuthProfile> => {
    switch (provider) {
        case 'google':
            return handleGoogleCallback(code);
        case 'github':
            return handleGitHubCallback(code);
        case '42':
            return handleFortyTwoCallback(code);
        default:
            throw new Error(`Unknown OAuth provider: ${provider}`);
    }
};

/**
 * Handle Google OAuth callback
 */
const handleGoogleCallback = async (code: string): Promise<OAuthProfile> => {
    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            client_id: env.oauth.google.clientId!,
            client_secret: env.oauth.google.clientSecret!,
            code,
            grant_type: 'authorization_code',
            redirect_uri: env.oauth.google.callbackUrl!,
        }),
    });

    if (!tokenResponse.ok) {
        const error = await tokenResponse.text();
        throw new Error(`Google token exchange failed: ${error}`);
    }

    const tokens = (await tokenResponse.json()) as OAuthTokenResponse;

    // Get user info
    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    if (!userResponse.ok) {
        throw new Error('Failed to fetch Google user info');
    }

    const userInfo = (await userResponse.json()) as GoogleUserInfo;

    return {
        provider: 'google',
        id: userInfo.id,
        email: userInfo.email,
        displayName: userInfo.name || userInfo.email.split('@')[0],
        avatarUrl: userInfo.picture,
    };
};

/**
 * Handle GitHub OAuth callback
 */
const handleGitHubCallback = async (code: string): Promise<OAuthProfile> => {
    // Exchange code for tokens
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
        },
        body: JSON.stringify({
            client_id: env.oauth.github.clientId,
            client_secret: env.oauth.github.clientSecret,
            code,
        }),
    });

    if (!tokenResponse.ok) {
        throw new Error('GitHub token exchange failed');
    }

    const tokens = (await tokenResponse.json()) as OAuthTokenResponse;

    // Get user info
    const userResponse = await fetch('https://api.github.com/user', {
        headers: {
            Authorization: `Bearer ${tokens.access_token}`,
            Accept: 'application/vnd.github.v3+json',
            'User-Agent': 'ft_transcendence',
        },
    });

    if (!userResponse.ok) {
        throw new Error('Failed to fetch GitHub user info');
    }

    const userInfo = (await userResponse.json()) as GitHubUserInfo;

    // Get email if not provided (private email)
    let email = userInfo.email;
    if (!email) {
        const emailResponse = await fetch('https://api.github.com/user/emails', {
            headers: {
                Authorization: `Bearer ${tokens.access_token}`,
                Accept: 'application/vnd.github.v3+json',
                'User-Agent': 'ft_transcendence',
            },
        });

        if (emailResponse.ok) {
            const emails = (await emailResponse.json()) as GitHubEmail[];
            const primaryEmail = emails.find((e) => e.primary && e.verified);
            email = primaryEmail?.email || emails[0]?.email || null;
        }
    }

    if (!email) {
        throw new Error('Could not retrieve email from GitHub');
    }

    return {
        provider: 'github',
        id: userInfo.id.toString(),
        email,
        displayName: userInfo.name || userInfo.login,
        avatarUrl: userInfo.avatar_url,
    };
};

/**
 * Handle 42 OAuth callback
 */
const handleFortyTwoCallback = async (code: string): Promise<OAuthProfile> => {
    // Exchange code for tokens
    const tokenResponse = await fetch('https://api.intra.42.fr/oauth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            grant_type: 'authorization_code',
            client_id: env.oauth.fortyTwo?.clientId!,
            client_secret: env.oauth.fortyTwo?.clientSecret!,
            code,
            redirect_uri: env.oauth.fortyTwo?.callbackUrl!,
        }),
    });

    if (!tokenResponse.ok) {
        const error = await tokenResponse.text();
        throw new Error(`42 token exchange failed: ${error}`);
    }

    const tokens = (await tokenResponse.json()) as OAuthTokenResponse;

    // Get user info
    const userResponse = await fetch('https://api.intra.42.fr/v2/me', {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    if (!userResponse.ok) {
        throw new Error('Failed to fetch 42 user info');
    }

    const userInfo = (await userResponse.json()) as FortyTwoUserInfo;

    return {
        provider: '42',
        id: userInfo.id.toString(),
        email: userInfo.email,
        displayName: userInfo.displayname || userInfo.login,
        avatarUrl: userInfo.image?.versions?.medium || userInfo.image?.link,
    };
};

/**
 * Generate a random state for OAuth CSRF protection
 */
export const generateOAuthState = (): string => {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
};
