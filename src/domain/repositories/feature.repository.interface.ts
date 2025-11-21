import { Feature } from '../entities';

export interface IFeatureRepository {
    create(feature: Feature): Promise<Feature>;
    findById(id: string): Promise<Feature | null>;
    findByProductId(productId: string): Promise<Feature[]>;
    findAll(): Promise<Feature[]>;
    update(feature: Feature): Promise<Feature>;
    delete(id: string): Promise<void>;
}

export const FEATURE_REPOSITORY = Symbol('IFeatureRepository');
