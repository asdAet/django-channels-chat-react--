import { apiService } from "../adapters/ApiService";
import type {
  LoginRequestDto as LoginDto,
  RegisterRequestDto as RegisterDto,
  SessionResponseDto as SessionDto,
  TwoFactorLoginRequestDto as TwoFactorLoginDto,
  UpdateProfileRequestDto as UpdateProfileDto,
} from "../dto";
import type { UserProfile as UserProfileDto } from "../entities/user/types";

/**
 * Класс AuthController инкапсулирует логику текущего слоя приложения.
 */
class AuthController {
  /**
   * Гарантирует csrf.
   * @returns Промис с данными, возвращаемыми этой функцией.
   */
  public async ensureCsrf(): Promise<{ csrfToken: string }> {
    return await apiService.ensureCsrf();
  }

  /**
   * Возвращает session.
   * @returns Промис с данными, возвращаемыми этой функцией.
   */
  public async getSession(): Promise<SessionDto> {
    return await apiService.getSession();
  }

  /**
   * Обрабатывает login.
   * @param dto DTO-объект для декодирования данных.
   * @returns Промис с данными, возвращаемыми этой функцией.
   */
  public async login(dto: LoginDto): Promise<SessionDto> {
    return await apiService.login(dto.identifier, dto.password);
  }

  public async confirmLoginTwoFactor(
    dto: TwoFactorLoginDto,
  ): Promise<SessionDto> {
    return await apiService.confirmLoginTwoFactor(dto);
  }

  /**
   * Обрабатывает oauth google.
   * @param token Токен аутентификации.
   * @param tokenType Тип токена аутентификации.
   * @returns Промис с данными, возвращаемыми этой функцией.
   */
  public async oauthGoogle(
    token: string,
    tokenType: "idToken" | "accessToken" = "idToken",
  ): Promise<SessionDto> {
    return await apiService.oauthGoogle(token, tokenType);
  }

  /**
   * Обрабатывает register.
   * @param dto DTO-объект для декодирования данных.
   * @returns Промис с данными, возвращаемыми этой функцией.
   */
  public async register(dto: RegisterDto): Promise<SessionDto> {
    return await apiService.register(
      dto.login,
      dto.password,
      dto.passwordConfirm,
      dto.name,
      dto.username,
      dto.email,
    );
  }

  /**
   * Возвращает password rules.
   * @returns Промис с данными, возвращаемыми этой функцией.
   */
  public async getPasswordRules(): Promise<{ rules: string[] }> {
    return await apiService.getPasswordRules();
  }

  /**
   * Обрабатывает logout.
   * @returns Промис с данными, возвращаемыми этой функцией.
   */
  public async logout(): Promise<{ ok: boolean }> {
    return await apiService.logout();
  }

  /**
   * Обновляет profile.
   * @param dto DTO-объект для декодирования данных.
   * @returns Промис с данными, возвращаемыми этой функцией.
   */
  public async updateProfile(
    dto: UpdateProfileDto,
  ): Promise<{ user: UserProfileDto }> {
    return await apiService.updateProfile(dto);
  }
}

/**
 * Хранит значение auth controller.
 *

 */

export const authController = new AuthController();
