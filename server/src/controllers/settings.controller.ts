import { Request, Response, NextFunction } from 'express';
import { Settings } from '../models/Settings';
import { logAdminActivity } from '../lib/activity';
import { localCache } from '../lib/cache';

// ─── Get Settings (Public) ──────────────────────────────────────────────────
export const getStoreSettings = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const settings = await Settings.getSettings();
    res.json({ success: true, data: settings });
  } catch (error) {
    next(error);
  }
};

// ─── Update Settings (Admin Only) ───────────────────────────────────────────
export const updateStoreSettings = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings({});
    }

    const previousName = settings.storeName;
    const {
      storeName,
      contactEmail,
      contactPhone,
      whatsappNumber,
      shippingFeeHome,
      shippingFeeStopdesk,
      freeShippingThreshold,
      promoBannerText,
      promoBannerActive,
    } = req.body;

    if (storeName) settings.storeName = storeName;
    if (contactEmail) settings.contactEmail = contactEmail;
    if (contactPhone) settings.contactPhone = contactPhone;
    if (whatsappNumber) settings.whatsappNumber = whatsappNumber;
    if (shippingFeeHome !== undefined) settings.shippingFeeHome = Number(shippingFeeHome);
    if (shippingFeeStopdesk !== undefined) settings.shippingFeeStopdesk = Number(shippingFeeStopdesk);
    if (freeShippingThreshold !== undefined) settings.freeShippingThreshold = Number(freeShippingThreshold);
    if (promoBannerText !== undefined) settings.promoBannerText = promoBannerText;
    if (promoBannerActive !== undefined) settings.promoBannerActive = Boolean(promoBannerActive);

    await settings.save();

    // Invalidate cached store settings
    localCache.deletePattern(/^cache:\/api\/settings/);

    // Log administrative action
    await logAdminActivity(
      req.user!.userId,
      req.user!.name,
      'SETTINGS_UPDATE',
      `Updated store settings (name: ${previousName} -> ${settings.storeName})`,
      req.ip
    );

    res.json({
      success: true,
      data: settings,
      message: 'Store settings updated successfully',
    });
  } catch (error) {
    next(error);
  }
};
