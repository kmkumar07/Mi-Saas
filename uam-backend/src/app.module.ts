import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './infrastructure/database/database.module';
import { AuthModule } from './presentation/modules/auth.module';
import { UsersModule } from './presentation/modules/users.module';
import { RolesModule } from './presentation/modules/roles.module';
import { PermissionsModule } from './presentation/modules/permissions.module';
import { InvitationsModule } from './presentation/modules/invitations.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: '.env',
        }),
        DatabaseModule,
        AuthModule,
        UsersModule,
        RolesModule,
        PermissionsModule,
        InvitationsModule,
    ],
    controllers: [],
    providers: [],
})
export class AppModule { }

