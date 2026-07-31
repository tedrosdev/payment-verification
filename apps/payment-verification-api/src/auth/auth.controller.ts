import { Controller, Post, Get, Body, Request, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Public } from './jwt-auth.guard';
import { AuthLoginRequest } from '@payment-verification/types';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  async login(@Body() loginDto: AuthLoginRequest) {
    return this.authService.login(loginDto);
  }

  @Get('me')
  async getProfile(@Request() req: any) {
    return this.authService.validateUser(req.user.id);
  }
}
