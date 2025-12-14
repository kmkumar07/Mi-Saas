import { IsString, IsNotEmpty, IsArray, ArrayMinSize, IsUrl, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * OAuth2 Client Registration Request DTO
 */
export class RegisterClientRequestDto {
    @ApiProperty({
        description: 'Client application name',
        example: 'My Application',
    })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({
        description: 'Array of redirect URIs',
        example: ['https://example.com/callback', 'https://example.com/callback2'],
        type: [String],
    })
    @IsArray()
    @ArrayMinSize(1)
    @IsUrl({}, { each: true })
    redirectUris: string[];

    @ApiProperty({
        description: 'Array of allowed scopes',
        example: ['openid', 'profile', 'email'],
        type: [String],
    })
    @IsArray()
    @ArrayMinSize(1)
    @IsString({ each: true })
    scopes: string[];

    @ApiProperty({
        description: 'Array of grant types',
        example: ['authorization_code', 'refresh_token'],
        type: [String],
        enum: ['authorization_code', 'client_credentials', 'refresh_token'],
    })
    @IsArray()
    @ArrayMinSize(1)
    @IsIn(['authorization_code', 'client_credentials', 'refresh_token'], { each: true })
    grantTypes: string[];
}

