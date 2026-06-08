import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ReportsService } from './reports.service';

@Controller()
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @MessagePattern('recruiting.annual_report')
  async getAnnualReport(@Payload() payload: { year: number }) {
    return this.reportsService.getAnnualReport(payload);
  }

  @MessagePattern('recruiting.department_report')
  async getDepartmentReport(@Payload() payload: { id: string; userId: string; role: string }) {
    return this.reportsService.getDepartmentReport(payload);
  }

  @MessagePattern('recruiting.time_to_hire')
  async getTimeToHireReport() {
    return this.reportsService.getTimeToHireReport();
  }

  @MessagePattern('recruiting.pipeline_overview')
  async getPipelineOverview() {
    return this.reportsService.getPipelineOverview();
  }
  @MessagePattern('recruiting.annual_report_export')
  async getAnnualReportExport(@Payload() payload: { year: number; format: 'csv' | 'pdf' }) {
    return this.reportsService.getAnnualReportExport(payload);
  }

  @MessagePattern('recruiting.realtime_tracking')
  async getRealtimeTracking(@Payload() payload: { userId: string; role: string }) {
    return this.reportsService.getRealtimeTracking(payload);
  }
}
