import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

/**
 * Email transporter (Nodemailer + Gmail SMTP)
 * SMTP credentials are loaded from .env — never hardcoded.
 */
let transporter: nodemailer.Transporter | null = null;

/**
 * Initialize the email transporter
 */
const getTransporter = (): nodemailer.Transporter => {
    if (!transporter) {
        transporter = nodemailer.createTransport({
            host: env.smtp.host,
            port: env.smtp.port,
            secure: env.smtp.port === 465, // true for 465, false for 587
            auth: {
                user: env.smtp.user,
                pass: env.smtp.pass,
            },
            connectionTimeout: 10000, // 10 seconds
            socketTimeout: 15000, // 15 seconds
            greetingTimeout: 10000, // 10 seconds
            tls: {
                rejectUnauthorized: false,
            },
        });
    }
    return transporter;
};

/**
 * Send a 2FA verification code via email
 */
export const sendVerificationCode = async (
    email: string,
    code: string
): Promise<void> => {
    const mail = getTransporter();

    await mail.sendMail({
        from: env.smtp.from,
        to: email,
        subject: 'ft_transcendence — Doğrulama Kodu',
        text: `Doğrulama kodunuz: ${code}\n\nBu kod 5 dakika geçerlidir.\nEğer bu işlemi siz yapmadıysanız, bu e-postayı dikkate almayın.`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #1a1a2e; color: #eee; border-radius: 12px;">
                <h2 style="text-align: center; color: #00d4ff; margin-bottom: 24px;">ft_transcendence</h2>
                <p style="text-align: center; font-size: 14px; color: #bbb;">Doğrulama kodunuz:</p>
                <div style="text-align: center; margin: 24px 0;">
                    <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #fff; background: #16213e; padding: 16px 32px; border-radius: 8px; display: inline-block;">${code}</span>
                </div>
                <p style="text-align: center; font-size: 12px; color: #888;">Bu kod 5 dakika geçerlidir.</p>
                <p style="text-align: center; font-size: 12px; color: #666; margin-top: 24px;">Eğer bu işlemi siz yapmadıysanız, bu e-postayı dikkate almayın.</p>
            </div>
        `,
    });
};

/**
 * Send a password reset code via email
 */
export const sendPasswordResetCode = async (
    email: string,
    code: string
): Promise<void> => {
    const mail = getTransporter();

    await mail.sendMail({
        from: env.smtp.from,
        to: email,
        subject: 'ft_transcendence — Şifre Sıfırlama',
        text: `Şifre sıfırlama kodunuz: ${code}\n\nBu kod 10 dakika geçerlidir.\nEğer bu işlemi siz yapmadıysanız, şifrenizi hemen değiştirin.`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #1a1a2e; color: #eee; border-radius: 12px;">
                <h2 style="text-align: center; color: #ff6b6b; margin-bottom: 24px;">Şifre Sıfırlama</h2>
                <p style="text-align: center; font-size: 14px; color: #bbb;">Şifre sıfırlama kodunuz:</p>
                <div style="text-align: center; margin: 24px 0;">
                    <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #fff; background: #16213e; padding: 16px 32px; border-radius: 8px; display: inline-block;">${code}</span>
                </div>
                <p style="text-align: center; font-size: 12px; color: #888;">Bu kod 10 dakika geçerlidir.</p>
                <p style="text-align: center; font-size: 12px; color: #ff6b6b; margin-top: 24px;">Eğer bu işlemi siz yapmadıysanız, şifrenizi hemen değiştirin.</p>
            </div>
        `,
    });
};

/**
 * Send 2FA enabled confirmation email
 */
export const send2FAEnabledNotification = async (
    email: string
): Promise<void> => {
    const mail = getTransporter();

    await mail.sendMail({
        from: env.smtp.from,
        to: email,
        subject: 'ft_transcendence — 2FA Aktifleştirildi',
        text: 'İki faktörlü doğrulama hesabınızda başarıyla aktifleştirildi.',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #1a1a2e; color: #eee; border-radius: 12px;">
                <h2 style="text-align: center; color: #00d4ff; margin-bottom: 24px;">ft_transcendence</h2>
                <p style="text-align: center; font-size: 16px; color: #4ade80;">✅ İki Faktörlü Doğrulama Aktif</p>
                <p style="text-align: center; font-size: 14px; color: #bbb; margin-top: 16px;">Hesabınız artık daha güvenli.</p>
            </div>
        `,
    });
};
