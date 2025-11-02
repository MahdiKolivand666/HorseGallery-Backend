import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private readonly apiKey: string;
  private readonly sender: string;
  private readonly template: string;
  private readonly enabled: boolean;
  private readonly baseUrl = 'https://api.kavenegar.com/v1';

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('SMS_API_KEY') || '';
    this.sender = this.configService.get<string>('SMS_SENDER') || '10008566';
    this.template = this.configService.get<string>('SMS_TEMPLATE') || 'verify';
    this.enabled = this.configService.get<string>('SMS_ENABLED') === 'true';
  }

  /**
   * Send verification code via SMS
   * @param mobile - User mobile number (09xxxxxxxxx)
   * @param code - Verification code (4-6 digits)
   */
  async sendVerificationCode(mobile: string, code: string): Promise<boolean> {
    try {
      // Development mode - just log the code
      if (!this.enabled) {
        this.logger.warn('⚠️ SMS is disabled (Development Mode)');
        this.logger.log(`📱 Verification code for ${mobile}: ${code}`);
        this.logger.log(
          `🔗 Would send SMS using Kavenegar template: ${this.template}`,
        );
        return true;
      }

      // Check if API key is configured
      if (!this.apiKey) {
        this.logger.error('❌ SMS_API_KEY is not configured');
        this.logger.log(`📱 Verification code for ${mobile}: ${code}`);
        return false;
      }

      // Send SMS via Kavenegar Lookup API
      const url = `${this.baseUrl}/${this.apiKey}/verify/lookup.json`;

      const response = await axios.post(url, {
        receptor: mobile,
        token: code,
        template: this.template,
      });

      if (response.data.return.status === 200) {
        this.logger.log(`✅ SMS sent successfully to ${mobile}`);
        return true;
      } else {
        this.logger.error(
          `❌ SMS failed: ${response.data.return.message}`,
          response.data,
        );
        return false;
      }
    } catch (error) {
      this.logger.error(
        `❌ Error sending SMS to ${mobile}: ${error.message}`,
        error.stack,
      );

      // In development, still show the code
      if (!this.enabled) {
        this.logger.log(`📱 Verification code for ${mobile}: ${code}`);
      }

      return false;
    }
  }

  /**
   * Send custom SMS message
   * @param mobile - User mobile number
   * @param message - Message content
   */
  async sendMessage(mobile: string, message: string): Promise<boolean> {
    try {
      if (!this.enabled) {
        this.logger.warn('⚠️ SMS is disabled (Development Mode)');
        this.logger.log(`📱 Message to ${mobile}: ${message}`);
        return true;
      }

      if (!this.apiKey) {
        this.logger.error('❌ SMS_API_KEY is not configured');
        return false;
      }

      const url = `${this.baseUrl}/${this.apiKey}/sms/send.json`;

      const response = await axios.post(url, {
        sender: this.sender,
        receptor: mobile,
        message: message,
      });

      if (response.data.return.status === 200) {
        this.logger.log(`✅ Custom SMS sent successfully to ${mobile}`);
        return true;
      } else {
        this.logger.error(`❌ SMS failed: ${response.data.return.message}`);
        return false;
      }
    } catch (error) {
      this.logger.error(
        `❌ Error sending custom SMS to ${mobile}: ${error.message}`,
      );
      return false;
    }
  }

  /**
   * Send password reset code
   * @param mobile - User mobile number
   * @param code - Reset code
   */
  async sendResetPasswordCode(mobile: string, code: string): Promise<boolean> {
    try {
      if (!this.enabled) {
        this.logger.warn('⚠️ SMS is disabled (Development Mode)');
        this.logger.log(`📱 Password reset code for ${mobile}: ${code}`);
        return true;
      }

      if (!this.apiKey) {
        this.logger.error('❌ SMS_API_KEY is not configured');
        this.logger.log(`📱 Password reset code for ${mobile}: ${code}`);
        return false;
      }

      // You can create another template for password reset in Kavenegar panel
      const url = `${this.baseUrl}/${this.apiKey}/verify/lookup.json`;

      const response = await axios.post(url, {
        receptor: mobile,
        token: code,
        template: 'resetpassword', // Create this template in your Kavenegar panel
      });

      if (response.data.return.status === 200) {
        this.logger.log(`✅ Password reset SMS sent successfully to ${mobile}`);
        return true;
      } else {
        this.logger.error(`❌ SMS failed: ${response.data.return.message}`);
        return false;
      }
    } catch (error) {
      this.logger.error(
        `❌ Error sending password reset SMS to ${mobile}: ${error.message}`,
      );

      if (!this.enabled) {
        this.logger.log(`📱 Password reset code for ${mobile}: ${code}`);
      }

      return false;
    }
  }

  /**
   * Check if SMS service is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Get SMS service status
   */
  getStatus() {
    return {
      enabled: this.enabled,
      hasApiKey: !!this.apiKey,
      sender: this.sender,
      template: this.template,
      provider: 'Kavenegar',
    };
  }
}
