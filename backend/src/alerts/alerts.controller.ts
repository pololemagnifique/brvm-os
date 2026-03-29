import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { AlertsService } from './alerts.service';
import { CreateAlertDto } from './dto/create-alert.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('alerts')
@UseGuards(JwtAuthGuard)
export class AlertsController {
  constructor(private alertsService: AlertsService) {}

  @Get()
  findAll(@Request() req) {
    return this.alertsService.findAll(req.user.id);
  }

  @Post()
  create(@Request() req, @Body() dto: CreateAlertDto) {
    return this.alertsService.create(req.user.id, dto);
  }

  @Patch(':id/toggle')
  toggle(@Param('id') id: string, @Request() req) {
    return this.alertsService.toggle(id, req.user.id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Request() req, @Body() dto: Partial<CreateAlertDto>) {
    return this.alertsService.update(id, req.user.id, dto);
  }

  @Delete(':id')
  delete(@Param('id') id: string, @Request() req) {
    return this.alertsService.delete(id, req.user.id);
  }
}
