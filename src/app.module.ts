import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PlansModule } from './plans.module';
import { TenantsModule } from './presentation/modules/tenants.module';
import { AccountsModule } from './presentation/modules/accounts.module';
import { UsageModule } from './presentation/modules/usage.module';
import { SubscriptionsModule } from './presentation/modules/subscriptions.module';
import { PaymentsModule } from './presentation/modules/payments.module';
import { WebhooksModule } from './presentation/modules/webhooks.module';

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
        SubscriptionsModule,
        PaymentsModule,
        WebhooksModule,
    ],
})
export class AppModule { }
