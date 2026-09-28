import 'dotenv/config';
import bcrypt from 'bcrypt';
import prisma from '../prisma/client.js';

const [name, email, password] = process.argv.slice(2);

if (!name || !email || !password) {
  console.error('Usage: node scripts/createAdmin.js "Full Name" email@example.com password');
  process.exit(1);
}

if (password.length < 6) {
  console.error('Password must be at least 6 characters.');
  process.exit(1);
}

const existing = await prisma.user.findUnique({ where: { email } });
if (existing) {
  console.error('A user with that email already exists.');
  process.exit(1);
}

const hashed = await bcrypt.hash(password, 10);
const user = await prisma.user.create({
  data: { name, email, password: hashed, role: 'admin' },
});

console.log(`Admin created: ${user.email} (id ${user.id})`);
await prisma.$disconnect();
process.exit(0);