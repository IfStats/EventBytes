import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
  ) {

     console.log(
  "JWT_SECRET:",
  configService.get("JWT_SECRET"),
);

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),

      ignoreExpiration: false,

      secretOrKey:
        configService.getOrThrow<string>('JWT_SECRET'),
    });
  }


  async validate(payload: any) {

  console.log("JWT VALIDATE CALLED");
  console.log(payload);

  return {
    id: payload.sub,
    email: payload.email,
  };
}

}