import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PlansModule } from './plans.module';
import { TenantsModule } from './presentation/modules/tenants.module';
import { AccountsModule } from './presentation/modules/accounts.module';
import { UsageModule } from './presentation/modules/usage.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: '.env',
        }),
        PlansModule,
        TenantsModule,
        AccountsModule,
        UsageModule,
    ],
})
export class AppModule { }
