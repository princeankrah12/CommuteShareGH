import { Router } from 'express';
import { WalletController } from '../controllers/WalletController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { validate } from '../middlewares/validateMiddleware';
import { topUpSchema } from '../schemas/walletSchema';

const router = Router();

router.use(authMiddleware);

router.get('/balance', WalletController.getBalance);
router.get('/details', WalletController.getWalletDetails);
router.get('/transactions', WalletController.getTransactions);
router.post('/topup', validate(topUpSchema), WalletController.topUp);
router.get('/verify/:reference', WalletController.verifyTopUp);

export default router;
