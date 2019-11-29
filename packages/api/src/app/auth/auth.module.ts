import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { RolesGuard } from './framework/roles.guard';
import { JwtStrategy } from './services/passport/jwt.strategy';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { UserModule } from '../user/user.module';
import { AuthService } from './services/auth.service';
import { authenticate } from 'passport';
import { USE_CASES } from './usecases';
import { SharedModule } from '../shared/shared.module';
import { GithubStrategy } from './services/passport/github.strategy';

const AUTH_STRATEGIES = [];

if (process.env.GITHUB_OAUTH_CLIENT_ID) {
  AUTH_STRATEGIES.push(GithubStrategy);
}

@Module({
  imports: [
    SharedModule,
    UserModule,
    PassportModule.register({
      defaultStrategy: 'jwt'
    }),
    JwtModule.register({
      secretOrKeyProvider: () => process.env.JWT_SECRET as string,
      signOptions: {
        expiresIn: 360000
      }
    }),
  ],
  controllers: [
    AuthController
  ],
  providers: [
    ...USE_CASES,
    ...AUTH_STRATEGIES,
    JwtStrategy,
    AuthService,
    RolesGuard,
  ],
  exports: [RolesGuard, AuthService]
})
export class AuthModule implements NestModule {
  public configure(consumer: MiddlewareConsumer) {
    if (process.env.GITHUB_OAUTH_CLIENT_ID) {
      consumer
        .apply(authenticate('github', {
          session: false,
          scope: []
        }))
        .forRoutes({
          path: '/auth/github',
          method: RequestMethod.GET
        });
    }
  }
}
