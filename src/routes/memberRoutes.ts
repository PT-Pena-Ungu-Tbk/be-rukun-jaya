// src/routes/memberRoutes.js
import express from 'express';
const router = express.Router();
import { verifyMember, getVipMembers, createVipMember, redeemPoints, exportVipMembers, updateMember, deleteMember } from '../controllers/memberController';
import { verifyToken, isOwner } from '../middlewares/authMiddleware';

// Endpoint: GET /api/v1/members/verify?phone=...
router.get('/verify', verifyToken, verifyMember);

// VIP Endpoints
router.get('/vip/export', verifyToken, isOwner, exportVipMembers);
router.get('/vip', verifyToken, getVipMembers);
router.post('/vip', verifyToken, isOwner, createVipMember);
router.post('/vip/:member_id/redeem', verifyToken, isOwner, redeemPoints);
router.put('/vip/:id', verifyToken, isOwner, updateMember);
router.delete('/vip/:id', verifyToken, isOwner, deleteMember);

export default router;