import { Inject, Injectable } from '@nestjs/common';
import { IFeatureRepository, FEATURE_REPOSITORY } from '@domain/repositories';
import { Feature } from '@domain/entities';
import { CreateFeatureDto } from '../../dtos/create-feature.dto';

@Injectable()
export class CreateFeatureUseCase {
    constructor(
        @Inject(FEATURE_REPOSITORY)
        private readonly featureRepository: IFeatureRepository,
    ) { }

    async execute(dto: CreateFeatureDto): Promise<Feature> {
        const feature = new Feature({
            productId: dto.productId,
            name: dto.name,
            code: dto.code,
            description: dto.description,
            featureType: dto.featureType,
            chargeModel: dto.chargeModel,
            serviceUrl: dto.serviceUrl,
            metadata: dto.metadata,
        });

        return await this.featureRepository.create(feature);
    }
}
