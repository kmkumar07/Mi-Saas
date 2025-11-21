import { Inject, Injectable } from '@nestjs/common';
import { IProductRepository, PRODUCT_REPOSITORY } from '@domain/repositories';
import { Product } from '@domain/entities';
import { CreateProductDto } from '../../dtos/create-product.dto';

@Injectable()
export class CreateProductUseCase {
    constructor(
        @Inject(PRODUCT_REPOSITORY)
        private readonly productRepository: IProductRepository,
    ) { }

    async execute(dto: CreateProductDto): Promise<Product> {
        const product = new Product({
            tenantId: dto.tenantId,
            name: dto.name,
            description: dto.description,
            metadata: dto.metadata,
        });

        return await this.productRepository.create(product);
    }
}
