# WhatsApp n8n Automation – Setup Guide

## Architecture

```
Backend (Spring Boot)  →  n8n (Webhook)  →  WhatsApp Business API (Graph API v22.0)
```

3 automations:

1. **Étudiant absent** → WhatsApp catch-up plan to student
2. **Formateur assigné** → WhatsApp session details to trainer
3. **Séance reportée** → WhatsApp alert to all managers

---

## 1. n8n Setup

### Import Workflow

1. Open n8n (`http://localhost:5678`)
2. Go to **Workflows → Import from File**
3. Select `n8n-whatsapp-workflow.json`

### Configure Credentials

1. Go to **Settings → Credentials → Add Credential**
2. Type: **Header Auth**
3. Name: `WhatsApp Business API`
4. Header Name: `Authorization`
5. Header Value: `Bearer EAALEs11lq9QBQpOcKQyNZBCxHWjQIDiTIPiJA5K6WKreQ40qh2HgxnczD5oAhUQPgX5NFAxUor7i6ZBOTE21jS4U1Rl3vGourXR8ZCvKbd5u6AU4rl28ocDCqpIgjw6ZBZB0oTEpg0XxnncK9wES7XHJYwJFN98mZCZA0MvyMKcn5cFJiRo6bq0A4CitrfycUwAu0vdJMUBRDuISloEERFF8ZAv3LNA3x3Y6hS2cE6F6b6Kn70Ok80tLrphHSvKILSoSaKJKSjPJfHO6gmHptZC9M`
6. Save, then assign this credential to all 3 HTTP Request nodes

### Activate Workflow

1. Toggle the workflow **Active** (top right)
2. The webhooks will be available at:
   - `POST http://localhost:5678/webhook/student-absent`
   - `POST http://localhost:5678/webhook/trainer-assigned`
   - `POST http://localhost:5678/webhook/seance-reported`

---

## 2. Backend Configuration

### application.yml

Already configured with:

```yaml
astba:
  n8n:
    base-url: ${ASTBA_N8N_BASE_URL:http://localhost:5678}
  whatsapp:
    enabled: ${ASTBA_WHATSAPP_ENABLED:true}
```

### Environment Variables (Production)

```env
ASTBA_N8N_BASE_URL=https://your-n8n-instance.com
ASTBA_WHATSAPP_ENABLED=true
```

Set `ASTBA_WHATSAPP_ENABLED=false` to disable WhatsApp without code changes.

---

## 3. Webhook Payloads

### 1. Student Absent (`/webhook/student-absent`)

```json
{
  "studentName": "Ahmed Ben Ali",
  "studentPhone": "21629040316",
  "trainingTitle": "Formation Sécurité",
  "seanceTitle": "Niveau 1 – Séance 3",
  "date": "2025-01-15",
  "startTime": "14:00",
  "endTime": "16:00"
}
```

### 2. Trainer Assigned (`/webhook/trainer-assigned`)

```json
{
  "trainerName": "Mohamed Trabelsi",
  "trainerPhone": "21629040316",
  "trainingTitle": "Formation Sécurité",
  "seanceTitle": "Niveau 1 – Séance 3",
  "groupName": "Groupe A",
  "date": "2025-01-15",
  "startTime": "14:00",
  "endTime": "16:00",
  "levelNumber": 1,
  "sessionNumber": 3
}
```

### 3. Séance Reported (`/webhook/seance-reported`)

```json
{
  "managerPhone": "21629040316",
  "trainerName": "Mohamed Trabelsi",
  "seanceTitle": "Niveau 1 – Séance 3",
  "trainingTitle": "Formation Sécurité",
  "date": "2025-01-15",
  "reason": "Formateur malade",
  "suggestedDate": "2025-01-20"
}
```

---

## 4. Trigger Points in Backend

| Event                        | Service Method                   | What Happens                                |
| ---------------------------- | -------------------------------- | ------------------------------------------- |
| Séance created               | `SeanceService.create()`         | WhatsApp to trainer with session details    |
| Séance started (IN_PROGRESS) | `SeanceService.autoMarkAbsent()` | WhatsApp to each student with catch-up info |
| Séance reported/postponed    | `SeanceService.reportSeance()`   | WhatsApp to all active managers             |

---

## 5. Phone Number Requirements

- Students & trainers must have a `phone` field in their profile
- Phone numbers are auto-normalized to Tunisia format (`216XXXXXXXX`)
- WhatsApp Business API requires the recipient to have WhatsApp on their number
- If phone is null/blank, the notification is silently skipped (logged at DEBUG)

---

## 6. Testing

### Manual Test with curl

```bash
curl -X POST http://localhost:5678/webhook/student-absent \
  -H "Content-Type: application/json" \
  -d '{
    "studentName": "Test Student",
    "studentPhone": "21629040316",
    "trainingTitle": "Formation Test",
    "seanceTitle": "Séance Test",
    "date": "2025-01-15",
    "startTime": "14:00",
    "endTime": "16:00"
  }'
```

### WhatsApp API Notes

- The bearer token expires periodically — renew it in Meta Business Manager
- Phone number ID: `986079917926325`
- Test number: `+216 29 040 316`
- Only numbers that have messaged your business number first can receive text messages (outside 24h window, you need approved templates)
