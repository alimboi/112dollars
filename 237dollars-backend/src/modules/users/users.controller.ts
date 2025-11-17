import {
  Controller,
  Get,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../types/user-role.enum';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('profile')
  async getProfile(@Request() req) {
    return this.usersService.getUserProfile(req.user.sub);
  }

  @Put('profile')
  async updateProfile(@Request() req, @Body() updateProfileDto: UpdateProfileDto) {
    return this.usersService.updateProfile(req.user.sub, updateProfileDto);
  }

  @Put('preferences')
  async updatePreferences(
    @Request() req,
    @Body() updatePreferencesDto: UpdatePreferencesDto,
  ) {
    return this.usersService.updatePreferences(
      req.user.sub,
      updatePreferencesDto,
    );
  }

  @Put('change-password')
  async changePassword(
    @Request() req,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    return this.usersService.changePassword(req.user.sub, changePasswordDto);
  }

  @Get('stats')
  async getUserStats(@Request() req) {
    return this.usersService.getUserStats(req.user.sub);
  }

  @Delete(':id')
  async deleteUser(@Request() req, @Param('id') id: string) {
    return this.usersService.deleteUser(+id, req.user.sub);
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.STUDENT_MANAGER)
  @Get()
  async getAllUsers(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ) {
    return this.usersService.getAllUsers(+page, +limit);
  }
}
