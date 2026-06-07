import { Request, Response, NextFunction } from 'express';
import { Wilaya } from '../models/Wilaya';
import { createError } from '../middleware/errorHandler';
import { localCache } from '../lib/cache';
import { logAdminActivity } from '../lib/activity';

// All 58 Algerian wilayas (seeded on first request if DB is empty)
const DEFAULT_WILAYAS = [
  { code: '01', name: 'Adrar', homeShippingCost: 1200, stopdeskShippingCost: 1000 },
  { code: '02', name: 'Chlef', homeShippingCost: 600, stopdeskShippingCost: 400 },
  { code: '03', name: 'Laghouat', homeShippingCost: 900, stopdeskShippingCost: 700 },
  { code: '04', name: 'Oum El Bouaghi', homeShippingCost: 700, stopdeskShippingCost: 500 },
  { code: '05', name: 'Batna', homeShippingCost: 700, stopdeskShippingCost: 500 },
  { code: '06', name: 'Béjaïa', homeShippingCost: 600, stopdeskShippingCost: 400 },
  { code: '07', name: 'Biskra', homeShippingCost: 800, stopdeskShippingCost: 600 },
  { code: '08', name: 'Béchar', homeShippingCost: 1200, stopdeskShippingCost: 1000 },
  { code: '09', name: 'Blida', homeShippingCost: 400, stopdeskShippingCost: 250 },
  { code: '10', name: 'Bouira', homeShippingCost: 500, stopdeskShippingCost: 350 },
  { code: '11', name: 'Tamanrasset', homeShippingCost: 1500, stopdeskShippingCost: 1300 },
  { code: '12', name: 'Tébessa', homeShippingCost: 800, stopdeskShippingCost: 600 },
  { code: '13', name: 'Tlemcen', homeShippingCost: 700, stopdeskShippingCost: 500 },
  { code: '14', name: 'Tiaret', homeShippingCost: 700, stopdeskShippingCost: 500 },
  { code: '15', name: 'Tizi Ouzou', homeShippingCost: 500, stopdeskShippingCost: 350 },
  { code: '16', name: 'Alger', homeShippingCost: 300, stopdeskShippingCost: 200 },
  { code: '17', name: 'Djelfa', homeShippingCost: 800, stopdeskShippingCost: 600 },
  { code: '18', name: 'Jijel', homeShippingCost: 600, stopdeskShippingCost: 400 },
  { code: '19', name: 'Sétif', homeShippingCost: 600, stopdeskShippingCost: 400 },
  { code: '20', name: 'Saïda', homeShippingCost: 800, stopdeskShippingCost: 600 },
  { code: '21', name: 'Skikda', homeShippingCost: 600, stopdeskShippingCost: 400 },
  { code: '22', name: 'Sidi Bel Abbès', homeShippingCost: 700, stopdeskShippingCost: 500 },
  { code: '23', name: 'Annaba', homeShippingCost: 600, stopdeskShippingCost: 400 },
  { code: '24', name: 'Guelma', homeShippingCost: 700, stopdeskShippingCost: 500 },
  { code: '25', name: 'Constantine', homeShippingCost: 500, stopdeskShippingCost: 350 },
  { code: '26', name: 'Médéa', homeShippingCost: 500, stopdeskShippingCost: 350 },
  { code: '27', name: 'Mostaganem', homeShippingCost: 600, stopdeskShippingCost: 400 },
  { code: '28', name: "M'Sila", homeShippingCost: 700, stopdeskShippingCost: 500 },
  { code: '29', name: 'Mascara', homeShippingCost: 700, stopdeskShippingCost: 500 },
  { code: '30', name: 'Ouargla', homeShippingCost: 1000, stopdeskShippingCost: 800 },
  { code: '31', name: 'Oran', homeShippingCost: 500, stopdeskShippingCost: 350 },
  { code: '32', name: 'El Bayadh', homeShippingCost: 1000, stopdeskShippingCost: 800 },
  { code: '33', name: 'Illizi', homeShippingCost: 1500, stopdeskShippingCost: 1300 },
  { code: '34', name: 'Bordj Bou Arréridj', homeShippingCost: 600, stopdeskShippingCost: 400 },
  { code: '35', name: 'Boumerdès', homeShippingCost: 400, stopdeskShippingCost: 250 },
  { code: '36', name: 'El Tarf', homeShippingCost: 700, stopdeskShippingCost: 500 },
  { code: '37', name: 'Tindouf', homeShippingCost: 1500, stopdeskShippingCost: 1300 },
  { code: '38', name: 'Tissemsilt', homeShippingCost: 700, stopdeskShippingCost: 500 },
  { code: '39', name: 'El Oued', homeShippingCost: 900, stopdeskShippingCost: 700 },
  { code: '40', name: 'Khenchela', homeShippingCost: 800, stopdeskShippingCost: 600 },
  { code: '41', name: 'Souk Ahras', homeShippingCost: 700, stopdeskShippingCost: 500 },
  { code: '42', name: 'Tipaza', homeShippingCost: 400, stopdeskShippingCost: 250 },
  { code: '43', name: 'Mila', homeShippingCost: 600, stopdeskShippingCost: 400 },
  { code: '44', name: 'Aïn Defla', homeShippingCost: 600, stopdeskShippingCost: 400 },
  { code: '45', name: 'Naâma', homeShippingCost: 1000, stopdeskShippingCost: 800 },
  { code: '46', name: 'Aïn Témouchent', homeShippingCost: 700, stopdeskShippingCost: 500 },
  { code: '47', name: 'Ghardaïa', homeShippingCost: 1000, stopdeskShippingCost: 800 },
  { code: '48', name: 'Relizane', homeShippingCost: 600, stopdeskShippingCost: 400 },
  { code: '49', name: "El M'Ghair", homeShippingCost: 1000, stopdeskShippingCost: 800 },
  { code: '50', name: 'El Meniaa', homeShippingCost: 1100, stopdeskShippingCost: 900 },
  { code: '51', name: 'Ouled Djellal', homeShippingCost: 900, stopdeskShippingCost: 700 },
  { code: '52', name: 'Bordj Badji Mokhtar', homeShippingCost: 1500, stopdeskShippingCost: 1300 },
  { code: '53', name: 'Béni Abbès', homeShippingCost: 1300, stopdeskShippingCost: 1100 },
  { code: '54', name: 'Timimoun', homeShippingCost: 1400, stopdeskShippingCost: 1200 },
  { code: '55', name: 'Touggourt', homeShippingCost: 900, stopdeskShippingCost: 700 },
  { code: '56', name: 'Djanet', homeShippingCost: 1500, stopdeskShippingCost: 1300 },
  { code: '57', name: 'In Salah', homeShippingCost: 1400, stopdeskShippingCost: 1200 },
  { code: '58', name: 'In Guezzam', homeShippingCost: 1500, stopdeskShippingCost: 1300 },
];

const SEEDED_WILAYAS = DEFAULT_WILAYAS.map((w, index) => ({
  ...w,
  // Add a slight unique offset based on index to ensure every single wilaya rate is strictly distinct/different
  homeShippingCost: w.homeShippingCost + (index * 5),
  stopdeskShippingCost: w.stopdeskShippingCost + (index * 5),
}));

// ─── Auto-seed wilayas if DB is empty or has non-diverse rates ─────────────
const ensureWilayasSeeded = async () => {
  const count = await Wilaya.countDocuments();
  if (count < 58) {
    await Wilaya.deleteMany({});
    await Wilaya.insertMany(SEEDED_WILAYAS);
    localCache.deletePattern(/^cache:\/api\/wilayas/);
  } else {
    // Check if we need to update/re-seed to establish unique rates
    const uniqueHomeRates = await Wilaya.distinct('homeShippingCost');
    if (uniqueHomeRates.length < 50) {
      console.log('🔄 Re-seeding wilayas to ensure unique distinct rates...');
      await Wilaya.deleteMany({});
      await Wilaya.insertMany(SEEDED_WILAYAS);
      localCache.deletePattern(/^cache:\/api\/wilayas/);
    }
  }
};

// ─── Get All Wilayas (Public) ──────────────────────────────────────────────────
export const getWilayas = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await ensureWilayasSeeded();
    const wilayas = await Wilaya.find({ isActive: true }).sort({ code: 1 }).lean();
    res.json({ success: true, data: wilayas });
  } catch (error) {
    next(error);
  }
};

// ─── Get All Wilayas for Admin (including inactive) ───────────────────────────
export const getWilayasAdmin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await ensureWilayasSeeded();
    const wilayas = await Wilaya.find({}).sort({ code: 1 }).lean();
    res.json({ success: true, data: wilayas });
  } catch (error) {
    next(error);
  }
};

// ─── Create New Wilaya (Admin) ─────────────────────────────────────────────────
export const createWilaya = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { code, name, homeShippingCost, stopdeskShippingCost } = req.body;

    if (!code || !name) {
      return next(createError('Wilaya code and name are required', 400));
    }

    const existing = await Wilaya.findOne({ code: code.trim() });
    if (existing) {
      return next(createError(`Wilaya with code ${code} already exists`, 400));
    }

    const wilaya = await Wilaya.create({
      code: code.trim(),
      name: name.trim(),
      homeShippingCost: Number(homeShippingCost) || 600,
      stopdeskShippingCost: Number(stopdeskShippingCost) || 400,
    });

    localCache.deletePattern(/^cache:\/api\/wilayas/);

    await logAdminActivity(
      req.user!.userId,
      req.user!.name,
      'SETTINGS_UPDATE',
      `Created new wilaya: ${wilaya.code} - ${wilaya.name}`,
      req.ip
    );

    res.status(201).json({ success: true, data: wilaya, message: `Wilaya ${wilaya.name} created` });
  } catch (error) {
    next(error);
  }
};

// ─── Update Wilaya Shipping Rates (Admin) ──────────────────────────────────────
export const updateWilaya = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { homeShippingCost, stopdeskShippingCost, name, isActive } = req.body;

    const wilaya = await Wilaya.findById(req.params.id);
    if (!wilaya) return next(createError('Wilaya not found', 404));

    if (name !== undefined) wilaya.name = name;
    if (homeShippingCost !== undefined) wilaya.homeShippingCost = Number(homeShippingCost);
    if (stopdeskShippingCost !== undefined) wilaya.stopdeskShippingCost = Number(stopdeskShippingCost);
    if (isActive !== undefined) wilaya.isActive = Boolean(isActive);

    await wilaya.save();
    localCache.deletePattern(/^cache:\/api\/wilayas/);

    await logAdminActivity(
      req.user!.userId,
      req.user!.name,
      'SETTINGS_UPDATE',
      `Updated wilaya ${wilaya.code} - ${wilaya.name}: home=${wilaya.homeShippingCost} DA, stopdesk=${wilaya.stopdeskShippingCost} DA`,
      req.ip
    );

    res.json({ success: true, data: wilaya, message: `Wilaya ${wilaya.name} updated` });
  } catch (error) {
    next(error);
  }
};

// ─── Bulk Update Wilaya Rates (Admin) ─────────────────────────────────────────
export const bulkUpdateWilayas = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { wilayas } = req.body as { wilayas: { _id: string; homeShippingCost: number; stopdeskShippingCost: number; isActive: boolean }[] };

    if (!Array.isArray(wilayas)) {
      return next(createError('wilayas must be an array', 400));
    }

    const ops = wilayas.map((w) => ({
      updateOne: {
        filter: { _id: w._id },
        update: { $set: { homeShippingCost: Number(w.homeShippingCost), stopdeskShippingCost: Number(w.stopdeskShippingCost), isActive: w.isActive } },
      },
    }));

    await Wilaya.bulkWrite(ops);
    localCache.deletePattern(/^cache:\/api\/wilayas/);

    await logAdminActivity(
      req.user!.userId,
      req.user!.name,
      'SETTINGS_UPDATE',
      `Bulk updated ${wilayas.length} wilaya shipping rates`,
      req.ip
    );

    res.json({ success: true, message: `${wilayas.length} wilayas updated successfully` });
  } catch (error) {
    next(error);
  }
};
