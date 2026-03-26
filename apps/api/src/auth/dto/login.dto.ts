import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'you@example.com', description: 'User email (MVP: not verified against DB)' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'password', description: 'Password (MVP: ignored; use mock auth only)' })
  @IsString()
  @MinLength(1)
  password!: string;
}
