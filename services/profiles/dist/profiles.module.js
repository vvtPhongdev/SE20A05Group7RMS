"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProfilesModule = void 0;
const common_1 = require("@nestjs/common");
const database_module_1 = require("./common/database/database.module");
const candidate_profiles_module_1 = require("./modules/candidate-profiles/candidate-profiles.module");
const documents_module_1 = require("./modules/documents/documents.module");
const evidence_module_1 = require("./modules/evidence/evidence.module");
let ProfilesModule = class ProfilesModule {
};
exports.ProfilesModule = ProfilesModule;
exports.ProfilesModule = ProfilesModule = __decorate([
    (0, common_1.Module)({
        imports: [database_module_1.DatabaseModule, candidate_profiles_module_1.CandidateProfilesModule, documents_module_1.DocumentsModule, evidence_module_1.EvidenceModule],
    })
], ProfilesModule);
//# sourceMappingURL=profiles.module.js.map