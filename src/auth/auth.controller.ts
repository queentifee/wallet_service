import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { GoogleAuthGuard } from './google-auth.guard';
import { access } from 'fs';


@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  async googleAuth() {
    // Initiates the Google OAuth2 login flow
    return { message: "Google authentication initiated"}
  }

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleCallback(@Req() req) {
    const user = await this.authService.validateGoogleUser(req.user);
    const token = this.authService.generateJwt(user);

    return {
      message: 'Login successful',
      accessToken: token,
      user,
    };
  }
}
