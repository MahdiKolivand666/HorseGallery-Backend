import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { Model } from 'mongoose';
import { User } from '../src/user/schemas/user.schema';
import { Address } from '../src/user/schemas/address.schema';
import { getModelToken } from '@nestjs/mongoose';
import { EncryptionService } from '../src/shared/utils/encryption';
import { ConfigService } from '@nestjs/config';

/**
 * Migration Script: Encrypt Existing Sensitive Data
 *
 * This script encrypts existing plain-text mobile numbers and addresses
 * in the database. Run this ONCE before deploying to production.
 *
 * Usage:
 *   npm run build
 *   node dist/scripts/migrate-encrypt-data.js
 */

async function bootstrap() {
  console.log('🔐 Starting data encryption migration...\n');

  // Create NestJS application context
  const app = await NestFactory.createApplicationContext(AppModule);

  // Get required services and models
  const userModel = app.get<Model<User>>(getModelToken(User.name));
  const addressModel = app.get<Model<Address>>(getModelToken(Address.name));
  const configService = app.get(ConfigService);

  // Get encryption keys
  const encryptionKey = configService.get<string>('ENCRYPTION_KEY');
  const encryptionHashKey = configService.get<string>('ENCRYPTION_HASH_KEY');

  // Validate keys
  if (!encryptionKey || encryptionKey.length !== 32) {
    console.error('❌ ERROR: ENCRYPTION_KEY must be exactly 32 characters!');
    console.error('   Current length:', encryptionKey?.length || 0);
    process.exit(1);
  }

  if (!encryptionHashKey) {
    console.error('❌ ERROR: ENCRYPTION_HASH_KEY is not set!');
    process.exit(1);
  }

  console.log('✅ Encryption keys validated\n');

  try {
    // ========================================================================
    // MIGRATE USER MOBILE NUMBERS
    // ========================================================================
    console.log('📱 Migrating user mobile numbers...');

    const users = await userModel.find().exec();
    let userMigratedCount = 0;
    let userSkippedCount = 0;
    let userErrorCount = 0;

    for (const user of users) {
      try {
        // Check if already encrypted (encrypted data is base64, plain is numeric)
        if (user.mobile && /^[0-9+]+$/.test(user.mobile)) {
          // Plain text mobile number - needs encryption
          const plainMobile = user.mobile;

          // Encrypt mobile
          user.mobile = await EncryptionService.encryptMobile(
            plainMobile,
            encryptionKey,
          );

          // Generate searchable hash
          (user as any).mobileHash = EncryptionService.hashMobile(
            plainMobile,
            encryptionHashKey,
          );

          await user.save();

          userMigratedCount++;
          console.log(`   ✓ Encrypted user: ${String(user._id)}`);
        } else {
          // Already encrypted or invalid
          userSkippedCount++;
          console.log(
            `   ⊘ Skipped user (already encrypted): ${String(user._id)}`,
          );
        }
      } catch (error) {
        userErrorCount++;
        console.error(
          `   ✗ Error encrypting user ${String(user._id)}:`,
          (error as Error).message,
        );
      }
    }

    console.log('\n📊 User Migration Summary:');
    console.log(`   Total users: ${users.length}`);
    console.log(`   Migrated: ${userMigratedCount}`);
    console.log(`   Skipped: ${userSkippedCount}`);
    console.log(`   Errors: ${userErrorCount}\n`);

    // ========================================================================
    // MIGRATE ADDRESS DATA
    // ========================================================================
    console.log('🏠 Migrating addresses...');

    const addresses = await addressModel.find().exec();
    let addressMigratedCount = 0;
    let addressSkippedCount = 0;
    let addressErrorCount = 0;

    for (const address of addresses) {
      try {
        const fullAddress = (address as any).fullAddress;

        // Check if fullAddress is plain text (not encrypted)
        // Encrypted data is base64, plain text contains readable characters
        if (fullAddress && !fullAddress.match(/^[A-Za-z0-9+/=]+$/)) {
          // Plain text address - needs encryption
          const plainAddress = fullAddress;

          // Encrypt address
          (address as any).fullAddress = await EncryptionService.encrypt(
            plainAddress,
            encryptionKey,
          );

          await address.save();

          addressMigratedCount++;
          console.log(`   ✓ Encrypted address: ${String(address._id)}`);
        } else if (fullAddress) {
          // Already encrypted
          addressSkippedCount++;
          console.log(
            `   ⊘ Skipped address (already encrypted): ${String(address._id)}`,
          );
        } else {
          // Empty address
          addressSkippedCount++;
          console.log(`   ⊘ Skipped address (empty): ${String(address._id)}`);
        }
      } catch (error) {
        addressErrorCount++;
        console.error(
          `   ✗ Error encrypting address ${String(address._id)}:`,
          (error as Error).message,
        );
      }
    }

    console.log('\n📊 Address Migration Summary:');
    console.log(`   Total addresses: ${addresses.length}`);
    console.log(`   Migrated: ${addressMigratedCount}`);
    console.log(`   Skipped: ${addressSkippedCount}`);
    console.log(`   Errors: ${addressErrorCount}\n`);

    // ========================================================================
    // FINAL SUMMARY
    // ========================================================================
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Migration completed successfully!\n');
    console.log('📊 Overall Summary:');
    console.log(`   Users encrypted: ${userMigratedCount}`);
    console.log(`   Addresses encrypted: ${addressMigratedCount}`);
    console.log(`   Total errors: ${userErrorCount + addressErrorCount}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    if (userErrorCount + addressErrorCount > 0) {
      console.warn('⚠️  Some items failed to encrypt. Review errors above.');
    }

    console.log('💡 Next steps:');
    console.log('   1. Verify encrypted data in MongoDB Compass');
    console.log('   2. Test login with encrypted mobile numbers');
    console.log('   3. Backup your database before deploying');
    console.log('   4. Deploy to production\n');
  } catch (error) {
    console.error('❌ Fatal error during migration:', (error as Error).message);
    process.exit(1);
  } finally {
    await app.close();
  }
}

// Run migration
bootstrap().catch((error: Error) => {
  console.error('❌ Migration failed:', error.message);
  process.exit(1);
});
