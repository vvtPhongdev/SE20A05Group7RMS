{{- define "works-recruiter.name" -}}
{{- .Chart.Name -}}
{{- end -}}

{{- define "works-recruiter.fullname" -}}
{{- printf "%s-%s" .Release.Name .Chart.Name | trunc 63 | trimSuffix "-" -}}
{{- end -}}

