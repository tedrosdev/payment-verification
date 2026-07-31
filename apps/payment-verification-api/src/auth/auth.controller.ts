import { Controller, Post, Get, Body, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { Public } from './jwt-auth.guard';
import { AuthLoginRequest } from '@payment-verification/types';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @ApiOperation({ summary: 'Admin login', description: 'Authenticate admin user and return JWT access/refresh tokens.' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid email or password' })
  async login(@Body() loginDto: AuthLoginRequest) {
    return this.authService.login(loginDto);
  }

  @Get('me')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get current admin profile', description: 'Retrieves current authenticated admin user details.' })
  @ApiResponse({ status: 200, description: 'Current profile retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getProfile(@Request() req: any) {
    return this.authService.validateUser(req.user.id);
  }
}
