import mongoose, { Document, Schema } from 'mongoose';

export interface ISettings extends Document {
  storeName: string;
  contactEmail: string;
  contactPhone: string;
  whatsappNumber: string;
  shippingFeeHome: number;
  shippingFeeStopdesk: number;
  freeShippingThreshold: number;
  promoBannerText?: string;
  promoBannerActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SettingsSchema = new Schema<ISettings>(
  {
    storeName: { type: String, default: 'RITE OF WAY', required: true },
    contactEmail: { type: String, default: 'support@riteofway.com', required: true },
    contactPhone: { type: String, default: '0550123456', required: true },
    whatsappNumber: { type: String, default: '213550123456', required: true },
    shippingFeeHome: { type: Number, default: 600, required: true },
    shippingFeeStopdesk: { type: Number, default: 350, required: true },
    freeShippingThreshold: { type: Number, default: 10000, required: true },
    promoBannerText: { type: String, default: 'Livraison gratuite sur toutes les commandes de plus de 10 000 DA !' },
    promoBannerActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Method to return a single settings instance (ensuring singleton pattern)
SettingsSchema.statics.getSettings = async function (): Promise<ISettings> {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

export interface ISettingsModel extends mongoose.Model<ISettings> {
  getSettings(): Promise<ISettings>;
}

export const Settings = mongoose.model<ISettings, ISettingsModel>('Settings', SettingsSchema);
