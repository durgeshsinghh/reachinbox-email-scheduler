import nodemailer from 'nodemailer';

export let etherealTransporter: nodemailer.Transporter | null = null;

export const createEtherealAccount = async () => {
  try {
    const testAccount = await nodemailer.createTestAccount();
    console.log('Ethereal Credentials:', testAccount);
    etherealTransporter = nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    return testAccount;
  } catch (error) {
    console.error('Failed to create Ethereal account', error);
    throw error;
  }
};
