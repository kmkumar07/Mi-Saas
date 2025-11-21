import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PlansModule } from './plans.module';
import { TenantsModule } from './presentation/modules/tenants.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: '.env',
        }),
        PlansModule,
        TenantsModule,
    ],
})
export class AppModule { }
