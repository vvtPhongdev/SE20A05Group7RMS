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

  @MessagePattern('recruiting.hr_request_queue_summary')
  async getHrRequestQueueSummary() {
    return this.reportsService.getHrRequestQueueSummary();
  }

  @MessagePattern('recruiting.hr_dashboard')
  async getHrDashboard() {
    return this.reportsService.getHrDashboard();
  }

  @MessagePattern('recruiting.annual_report_export')
  async getAnnualReportExport(@Payload() payload: { year: number; format: 'csv' | 'pdf' }) {
    return this.reportsService.getAnnualReportExport(payload);
  }

  @MessagePattern('recruiting.realtime_tracking')
  async getRealtimeTracking(@Payload() payload: { userId: string; role: string }) {
    return this.reportsService.getRealtimeTracking(payload);
  }

  @MessagePattern('recruiting.admin_dashboard')
  async getAdminDashboard() {
    return this.reportsService.getAdminDashboard();
  }

  @MessagePattern('recruiting.department_stats')
  async getDepartmentStats(@Payload() payload: { range?: '30d' | 'quarter' | 'year' }) {
    return this.reportsService.getDepartmentStats(payload);
  }
}
