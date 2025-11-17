import { DataSource } from 'typeorm';
import { dataSourceOptions } from '../../config/database.config';
import * as bcrypt from 'bcrypt';
import { User } from '../entities/user.entity';
import { UserRole } from '../../types/user-role.enum';

async function createSuperAdmin() {
  const dataSource = new DataSource(dataSourceOptions);
  await dataSource.initialize();

  console.log('🔧 Creating new Super Admin...');

  const userRepository = dataSource.getRepository(User);

  // Remove old seeded admin if exists
  const oldAdmin = await userRepository.findOne({
    where: { email: 'admin@237dollars.com' },
  });

  if (oldAdmin) {
    await userRepository.remove(oldAdmin);
    console.log('✅ Removed old seeded admin (admin@237dollars.com)');
  }

  // Create new super admin
  const newSuperAdminEmail = '1995udba@gmail.com';
  const existingSuperAdmin = await userRepository.findOne({
    where: { email: newSuperAdminEmail },
  });

  if (existingSuperAdmin) {
    console.log('ℹ️  Super Admin already exists: ' + newSuperAdminEmail);
    await dataSource.destroy();
    return;
  }

  const hashedPassword = await bcrypt.hash('SuperAdmin@2024', 12);
  const superAdmin = userRepository.create({
    email: newSuperAdminEmail,
    username: 'superadmin',
    firstName: 'Super',
    lastName: 'Admin',
    password: hashedPassword,
    role: UserRole.SUPER_ADMIN,
    isActive: true,
    emailVerified: true, // Skip email verification for admin
  });

  await userRepository.save(superAdmin);
  console.log('\n✅ Super Admin Created Successfully!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📧 Email: ' + newSuperAdminEmail);
  console.log('🔑 Password: SuperAdmin@2024');
  console.log('👤 Username: superadmin');
  console.log('🛡️  Role: SUPER_ADMIN');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  await dataSource.destroy();
}

createSuperAdmin()
  .then(() => {
    console.log('✨ Super Admin setup complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error creating super admin:', error);
    process.exit(1);
  });
