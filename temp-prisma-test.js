const { PrismaClient } = require('@prisma/client'); const p = new PrismaClient(); console.log('pc', typeof PrismaClient, 'use', typeof p['']);
