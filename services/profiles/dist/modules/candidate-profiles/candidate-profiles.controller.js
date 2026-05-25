"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CandidateProfilesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const candidate_profiles_service_1 = require("./candidate-profiles.service");
let CandidateProfilesController = class CandidateProfilesController {
    service;
    constructor(service) {
        this.service = service;
    }
    findAll() {
        return this.service.findAll();
    }
};
exports.CandidateProfilesController = CandidateProfilesController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], CandidateProfilesController.prototype, "findAll", null);
exports.CandidateProfilesController = CandidateProfilesController = __decorate([
    (0, swagger_1.ApiTags)('candidate-profiles'),
    (0, common_1.Controller)('candidate-profiles'),
    __metadata("design:paramtypes", [candidate_profiles_service_1.CandidateProfilesService])
], CandidateProfilesController);
//# sourceMappingURL=candidate-profiles.controller.js.map