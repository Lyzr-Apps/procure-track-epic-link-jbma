'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { callAIAgent } from '@/lib/aiAgent'
import { cn } from '@/lib/utils'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

import {
  HiOutlineChartBar,
  HiOutlineShieldCheck,
  HiOutlineChatBubbleLeftRight,
  HiOutlineClipboardDocumentList,
  HiOutlineClock,
  HiOutlineExclamationTriangle,
  HiOutlineCheckCircle,
  HiOutlineArrowTrendingUp,
  HiOutlineArrowTrendingDown,
  HiOutlineFunnel,
  HiOutlineMagnifyingGlass,
  HiOutlineUser,
  HiOutlineBars3,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlineSparkles,
  HiOutlineBellAlert,
  HiOutlineDocumentText,
  HiOutlineArrowPath,
  HiOutlineInformationCircle,
} from 'react-icons/hi2'

import {
  FiSend,
  FiChevronRight,
  FiActivity,
  FiAlertCircle,
  FiCheckCircle,
  FiClock,
  FiLoader,
} from 'react-icons/fi'

import { LuLayoutDashboard, LuMessageSquareWarning } from 'react-icons/lu'

// ============================================================================
// CONSTANTS
// ============================================================================

const AGENT_IDS = {
  INSIGHTS: '6999834f5fcf634111651131',
  COMPLIANCE: '699983502a0c0e9d620904df',
  GRIEVANCE: '699983502a0c0e9d620904e1',
} as const

const AGENTS_INFO = [
  { id: AGENT_IDS.INSIGHTS, name: 'Procurement Insights Agent', purpose: 'PR/PO status, TAT metrics, SLA compliance, bottleneck analysis' },
  { id: AGENT_IDS.COMPLIANCE, name: 'Compliance Trail Agent', purpose: 'DOA approval records, SOP compliance, audit summaries' },
  { id: AGENT_IDS.GRIEVANCE, name: 'Grievance Agent', purpose: 'Raise/track procurement grievances, resolution tracking' },
]

type ScreenType = 'dashboard' | 'audit' | 'grievances'

// ============================================================================
// INTERFACES
// ============================================================================

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  data?: Record<string, unknown>
  timestamp: Date
}

interface InsightsData {
  summary?: string
  details?: string
  metrics?: Array<{ label: string; value: string }>
  recommendations?: string[]
  status?: string
}

interface AuditTrailEntry {
  step: string
  approver: string
  timestamp: string
  doa_level: string
  status: string
  sop_reference: string
}

interface ComplianceData {
  summary?: string
  audit_trail?: AuditTrailEntry[]
  compliance_status?: string
  exceptions?: string[]
  sop_references?: string[]
}

interface GrievanceData {
  action?: string
  grievance_id?: string
  type?: string
  status?: string
  details?: string
  next_steps?: string[]
  resolution_timeline?: string
}

interface MockPR {
  pr_number: string
  requester: string
  status: string
  current_stage: string
  tat_days: number
  sla_status: string
  last_updated: string
  amount: string
}

interface MockAuditEvent {
  event: string
  actor: string
  timestamp: string
  doa_level: string
  sop_reference: string
  status: string
  pr_po: string
}

interface MockGrievance {
  id: string
  type: string
  related_pr_po: string
  submitted_by: string
  date: string
  status: string
  assigned_to: string
  priority: string
}

// ============================================================================
// MOCK DATA
// ============================================================================

const MOCK_PRS: MockPR[] = [
  { pr_number: 'PR-4521', requester: 'Sarah Chen', status: 'Active', current_stage: 'DOA Review', tat_days: 3, sla_status: 'On Time', last_updated: '2025-02-20', amount: '$24,500' },
  { pr_number: 'PR-7832', requester: 'Marcus Johnson', status: 'Active', current_stage: 'PO Generated', tat_days: 7, sla_status: 'At Risk', last_updated: '2025-02-19', amount: '$156,000' },
  { pr_number: 'PR-3198', requester: 'Anita Patel', status: 'Active', current_stage: 'Goods Receipt', tat_days: 12, sla_status: 'Breached', last_updated: '2025-02-15', amount: '$89,200' },
  { pr_number: 'PR-5610', requester: 'James Wright', status: 'Active', current_stage: 'Created', tat_days: 1, sla_status: 'On Time', last_updated: '2025-02-21', amount: '$12,750' },
  { pr_number: 'PR-9044', requester: 'Lisa Kim', status: 'Active', current_stage: 'DOA Review', tat_days: 5, sla_status: 'On Time', last_updated: '2025-02-18', amount: '$67,800' },
  { pr_number: 'PR-2277', requester: 'Robert Garcia', status: 'Active', current_stage: 'Completed', tat_days: 15, sla_status: 'On Time', last_updated: '2025-02-10', amount: '$340,000' },
  { pr_number: 'PR-6189', requester: 'Emily Foster', status: 'Active', current_stage: 'PO Generated', tat_days: 9, sla_status: 'At Risk', last_updated: '2025-02-17', amount: '$45,300' },
  { pr_number: 'PR-1455', requester: 'David Okafor', status: 'Active', current_stage: 'DOA Review', tat_days: 4, sla_status: 'On Time', last_updated: '2025-02-19', amount: '$28,900' },
  { pr_number: 'PR-8321', requester: 'Hannah Lee', status: 'Active', current_stage: 'Created', tat_days: 0, sla_status: 'On Time', last_updated: '2025-02-21', amount: '$8,600' },
  { pr_number: 'PR-7003', requester: 'Carlos Mendez', status: 'Active', current_stage: 'Goods Receipt', tat_days: 14, sla_status: 'Breached', last_updated: '2025-02-14', amount: '$195,000' },
  { pr_number: 'PR-4098', requester: 'Nina Petrova', status: 'Active', current_stage: 'PO Generated', tat_days: 6, sla_status: 'On Time', last_updated: '2025-02-18', amount: '$72,100' },
  { pr_number: 'PR-5533', requester: 'Tom Bradley', status: 'Active', current_stage: 'DOA Review', tat_days: 8, sla_status: 'At Risk', last_updated: '2025-02-16', amount: '$53,400' },
]

const MOCK_AUDIT_EVENTS: MockAuditEvent[] = [
  { event: 'PR Created', actor: 'Sarah Chen', timestamp: '2025-02-17 09:15', doa_level: '-', sop_reference: 'SOP-PR-001', status: 'Completed', pr_po: 'PR-4521' },
  { event: 'L1 Approval', actor: 'Mark Stevens', timestamp: '2025-02-17 14:22', doa_level: 'L1', sop_reference: 'SOP-DOA-L1', status: 'Approved', pr_po: 'PR-4521' },
  { event: 'L2 Approval', actor: 'Diana Ross', timestamp: '2025-02-18 10:05', doa_level: 'L2', sop_reference: 'SOP-DOA-L2', status: 'Pending', pr_po: 'PR-4521' },
  { event: 'PO Generated', actor: 'System', timestamp: '2025-02-15 11:30', doa_level: '-', sop_reference: 'SOP-PO-001', status: 'Completed', pr_po: 'PR-7832' },
  { event: 'Vendor Confirmation', actor: 'AcmeCorp', timestamp: '2025-02-16 08:45', doa_level: '-', sop_reference: 'SOP-VEN-002', status: 'Completed', pr_po: 'PR-7832' },
  { event: 'L3 Approval', actor: 'VP Finance', timestamp: '2025-02-14 16:00', doa_level: 'L3', sop_reference: 'SOP-DOA-L3', status: 'Approved', pr_po: 'PR-3198' },
  { event: 'Goods Received', actor: 'Warehouse Team', timestamp: '2025-02-15 09:20', doa_level: '-', sop_reference: 'SOP-GR-001', status: 'Completed', pr_po: 'PR-3198' },
  { event: 'SLA Breach Notification', actor: 'System', timestamp: '2025-02-15 00:00', doa_level: '-', sop_reference: 'SOP-SLA-001', status: 'Alert', pr_po: 'PR-3198' },
  { event: 'PR Created', actor: 'James Wright', timestamp: '2025-02-21 08:00', doa_level: '-', sop_reference: 'SOP-PR-001', status: 'Completed', pr_po: 'PR-5610' },
  { event: 'Budget Verification', actor: 'Finance Bot', timestamp: '2025-02-21 08:15', doa_level: '-', sop_reference: 'SOP-BUD-001', status: 'Completed', pr_po: 'PR-5610' },
  { event: 'L1 Approval', actor: 'Kate Morrison', timestamp: '2025-02-18 13:40', doa_level: 'L1', sop_reference: 'SOP-DOA-L1', status: 'Approved', pr_po: 'PR-9044' },
  { event: 'L2 Escalation', actor: 'System', timestamp: '2025-02-19 09:00', doa_level: 'L2', sop_reference: 'SOP-ESC-001', status: 'Escalated', pr_po: 'PR-9044' },
]

const MOCK_GRIEVANCES: MockGrievance[] = [
  { id: 'GRV-001', type: 'Approval Delay', related_pr_po: 'PR-3198', submitted_by: 'Anita Patel', date: '2025-02-16', status: 'Open', assigned_to: 'Procurement Lead', priority: 'High' },
  { id: 'GRV-002', type: 'Policy Concern', related_pr_po: 'PR-7832', submitted_by: 'Marcus Johnson', date: '2025-02-18', status: 'In Progress', assigned_to: 'Compliance Team', priority: 'Medium' },
  { id: 'GRV-003', type: 'Vendor Issue', related_pr_po: 'PO-4410', submitted_by: 'Lisa Kim', date: '2025-02-10', status: 'Resolved', assigned_to: 'Vendor Manager', priority: 'Low' },
  { id: 'GRV-004', type: 'SLA Breach', related_pr_po: 'PR-7003', submitted_by: 'Carlos Mendez', date: '2025-02-15', status: 'Overdue', assigned_to: 'SLA Team', priority: 'Critical' },
  { id: 'GRV-005', type: 'Budget Override', related_pr_po: 'PR-2277', submitted_by: 'Robert Garcia', date: '2025-02-12', status: 'In Progress', assigned_to: 'Finance Lead', priority: 'High' },
  { id: 'GRV-006', type: 'Approval Delay', related_pr_po: 'PR-5533', submitted_by: 'Tom Bradley', date: '2025-02-19', status: 'Open', assigned_to: 'DOA Committee', priority: 'Medium' },
  { id: 'GRV-007', type: 'Delivery Delay', related_pr_po: 'PO-3822', submitted_by: 'Emily Foster', date: '2025-02-08', status: 'Resolved', assigned_to: 'Logistics Team', priority: 'Low' },
  { id: 'GRV-008', type: 'Quality Issue', related_pr_po: 'PO-5901', submitted_by: 'Hannah Lee', date: '2025-02-20', status: 'Open', assigned_to: 'QA Team', priority: 'High' },
  { id: 'GRV-009', type: 'Compliance Violation', related_pr_po: 'PR-6189', submitted_by: 'David Okafor', date: '2025-02-17', status: 'In Progress', assigned_to: 'Audit Team', priority: 'Critical' },
  { id: 'GRV-010', type: 'Process Error', related_pr_po: 'PR-4098', submitted_by: 'Nina Petrova', date: '2025-02-20', status: 'Open', assigned_to: 'Process Team', priority: 'Medium' },
]

const SAMPLE_INSIGHTS: InsightsData = {
  summary: 'Current procurement cycle shows a 12% improvement in TAT over the previous quarter. Three PRs are flagged as SLA-critical and require immediate attention.',
  details: 'Analysis of 47 active purchase requisitions reveals that the DOA Review stage is the primary bottleneck, accounting for 38% of total cycle time. The average TAT has decreased from 11.2 days to 9.8 days. However, PRs exceeding $100K continue to face delays at L3 approval, with an average wait time of 4.2 days at this stage alone.\n\nKey areas of concern include cross-departmental PRs where multiple DOA levels are required, and vendor-specific POs where contract negotiations extend the timeline.',
  metrics: [
    { label: 'Average TAT', value: '9.8 days' },
    { label: 'SLA Compliance Rate', value: '87.2%' },
    { label: 'Bottleneck Stage', value: 'DOA Review' },
    { label: 'Active PRs', value: '47' },
    { label: 'POs in Progress', value: '23' },
  ],
  recommendations: [
    'Escalate PR-3198 and PR-7003 immediately - both have breached SLA by 2+ days',
    'Review DOA L2 approval queue - 5 PRs pending for >48 hours',
    'Consider implementing auto-escalation for PRs exceeding 7-day TAT',
    'Schedule vendor performance review for AcmeCorp - 3 delayed deliveries this quarter',
  ],
  status: 'At Risk',
}

const SAMPLE_COMPLIANCE: ComplianceData = {
  summary: 'Compliance audit of PR-4521 shows proper DOA chain followed through L1. L2 approval is pending since Feb 18. All SOP references are valid and documentation is complete.',
  audit_trail: [
    { step: 'Step 1: PR Creation', approver: 'Sarah Chen', timestamp: '2025-02-17 09:15', doa_level: 'Requestor', status: 'Completed', sop_reference: 'SOP-PR-001 v3.2' },
    { step: 'Step 2: Budget Check', approver: 'Finance Bot', timestamp: '2025-02-17 09:16', doa_level: 'System', status: 'Passed', sop_reference: 'SOP-BUD-001 v2.1' },
    { step: 'Step 3: L1 Approval', approver: 'Mark Stevens', timestamp: '2025-02-17 14:22', doa_level: 'L1 - Dept Manager', status: 'Approved', sop_reference: 'SOP-DOA-L1 v4.0' },
    { step: 'Step 4: L2 Approval', approver: 'Diana Ross', timestamp: 'Pending', doa_level: 'L2 - VP', status: 'Awaiting', sop_reference: 'SOP-DOA-L2 v4.0' },
  ],
  compliance_status: 'Compliant - Pending L2',
  exceptions: ['L2 approval pending beyond 48-hour SLA window'],
  sop_references: ['SOP-PR-001 v3.2', 'SOP-BUD-001 v2.1', 'SOP-DOA-L1 v4.0', 'SOP-DOA-L2 v4.0'],
}

const SAMPLE_GRIEVANCE: GrievanceData = {
  action: 'Grievance registered and assigned to the DOA Committee for review. Auto-escalation timer set for 48 hours.',
  grievance_id: 'GRV-011',
  type: 'Approval Delay',
  status: 'Open',
  details: 'A new grievance has been created for the reported approval delay on PR-5533. The DOA L2 approval has been pending for 8 days, exceeding the standard 3-day SLA. The case has been flagged as high priority and assigned to the DOA Committee. Stakeholders have been notified via email.',
  next_steps: [
    'DOA Committee to review within 24 hours',
    'Escalation to L3 authority if no action within 48 hours',
    'Weekly status update will be sent to the requester',
    'Post-resolution audit trail entry will be auto-generated',
  ],
  resolution_timeline: '3-5 business days',
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function renderMarkdown(text: string) {
  if (!text) return null
  return (
    <div className="space-y-2">
      {text.split('\n').map((line, i) => {
        if (line.startsWith('### '))
          return <h4 key={i} className="font-semibold text-sm mt-3 mb-1">{line.slice(4)}</h4>
        if (line.startsWith('## '))
          return <h3 key={i} className="font-semibold text-base mt-3 mb-1">{line.slice(3)}</h3>
        if (line.startsWith('# '))
          return <h2 key={i} className="font-bold text-lg mt-4 mb-2">{line.slice(2)}</h2>
        if (line.startsWith('- ') || line.startsWith('* '))
          return <li key={i} className="ml-4 list-disc text-sm">{formatInline(line.slice(2))}</li>
        if (/^\d+\.\s/.test(line))
          return <li key={i} className="ml-4 list-decimal text-sm">{formatInline(line.replace(/^\d+\.\s/, ''))}</li>
        if (!line.trim()) return <div key={i} className="h-1" />
        return <p key={i} className="text-sm">{formatInline(line)}</p>
      })}
    </div>
  )
}

function formatInline(text: string) {
  const parts = text.split(/\*\*(.*?)\*\*/g)
  if (parts.length === 1) return text
  return parts.map((part, i) =>
    i % 2 === 1 ? <strong key={i} className="font-semibold">{part}</strong> : part
  )
}

function getStatusColor(status: string): string {
  const s = (status ?? '').toLowerCase()
  if (s.includes('on time') || s.includes('completed') || s.includes('approved') || s.includes('resolved') || s.includes('passed') || s.includes('compliant') || s.includes('on track')) {
    return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
  }
  if (s.includes('at risk') || s.includes('pending') || s.includes('in progress') || s.includes('awaiting') || s.includes('escalated')) {
    return 'bg-amber-500/15 text-amber-400 border-amber-500/30'
  }
  if (s.includes('breach') || s.includes('overdue') || s.includes('critical') || s.includes('alert') || s.includes('violation')) {
    return 'bg-red-500/15 text-red-400 border-red-500/30'
  }
  return 'bg-muted text-muted-foreground border-border'
}

function getPriorityColor(priority: string): string {
  const p = (priority ?? '').toLowerCase()
  if (p === 'critical') return 'bg-red-500/15 text-red-400 border-red-500/30'
  if (p === 'high') return 'bg-orange-500/15 text-orange-400 border-orange-500/30'
  if (p === 'medium') return 'bg-amber-500/15 text-amber-400 border-amber-500/30'
  return 'bg-muted text-muted-foreground border-border'
}

// ============================================================================
// ERROR BOUNDARY
// ============================================================================

class PageErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false, error: '' }
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
          <div className="text-center p-8 max-w-md">
            <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
            <p className="text-muted-foreground mb-4 text-sm">{this.state.error}</p>
            <button
              onClick={() => this.setState({ hasError: false, error: '' })}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm"
            >
              Try again
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

// ============================================================================
// INSIGHTS RESPONSE RENDERER
// ============================================================================

function InsightsResponseCard({ data }: { data: InsightsData }) {
  const metrics = Array.isArray(data?.metrics) ? data.metrics : []
  const recs = Array.isArray(data?.recommendations) ? data.recommendations : []

  return (
    <div className="space-y-3">
      {data?.status && (
        <Badge className={cn('text-xs', getStatusColor(data.status))}>{data.status}</Badge>
      )}
      {data?.summary && (
        <div className="text-sm text-foreground/90">{renderMarkdown(data.summary)}</div>
      )}
      {data?.details && (
        <div className="text-sm text-muted-foreground mt-2">{renderMarkdown(data.details)}</div>
      )}
      {metrics.length > 0 && (
        <div className="grid grid-cols-2 gap-2 mt-3">
          {metrics.map((m, i) => (
            <div key={i} className="bg-secondary/50 rounded-lg p-2.5 border border-border/50">
              <p className="text-[11px] text-muted-foreground uppercase tracking-wider">{m?.label ?? ''}</p>
              <p className="text-sm font-semibold text-foreground mt-0.5">{m?.value ?? ''}</p>
            </div>
          ))}
        </div>
      )}
      {recs.length > 0 && (
        <div className="mt-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Recommendations</p>
          <ul className="space-y-1.5">
            {recs.map((r, i) => (
              <li key={i} className="text-sm text-foreground/80 flex items-start gap-2">
                <FiChevronRight className="w-3.5 h-3.5 mt-0.5 text-emerald-400 shrink-0" />
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

// ============================================================================
// COMPLIANCE RESPONSE RENDERER
// ============================================================================

function ComplianceResponseCard({ data }: { data: ComplianceData }) {
  const trail = Array.isArray(data?.audit_trail) ? data.audit_trail : []
  const exceptions = Array.isArray(data?.exceptions) ? data.exceptions : []
  const sopRefs = Array.isArray(data?.sop_references) ? data.sop_references : []

  return (
    <div className="space-y-3">
      {data?.compliance_status && (
        <Badge className={cn('text-xs', getStatusColor(data.compliance_status))}>{data.compliance_status}</Badge>
      )}
      {data?.summary && (
        <div className="text-sm text-foreground/90">{renderMarkdown(data.summary)}</div>
      )}
      {trail.length > 0 && (
        <div className="mt-3 space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Audit Trail</p>
          {trail.map((entry, i) => {
            const entryStatus = (entry?.status ?? '').toLowerCase()
            const dotColor = entryStatus === 'approved' || entryStatus === 'completed' || entryStatus === 'passed'
              ? 'bg-emerald-400'
              : entryStatus === 'awaiting' || entryStatus === 'pending'
                ? 'bg-amber-400'
                : 'bg-muted-foreground'
            return (
              <div key={i} className="bg-secondary/50 rounded-lg p-2.5 border border-border/50 flex items-start gap-3">
                <div className={cn('w-2 h-2 rounded-full mt-1.5 shrink-0', dotColor)} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{entry?.step ?? ''}</p>
                  <p className="text-xs text-muted-foreground">{entry?.approver ?? ''} -- {entry?.doa_level ?? ''} -- {entry?.timestamp ?? ''}</p>
                  <div className="flex gap-2 mt-1 flex-wrap">
                    <Badge className={cn('text-[10px] px-1.5 py-0', getStatusColor(entry?.status ?? ''))}>{entry?.status ?? ''}</Badge>
                    <span className="text-[10px] text-muted-foreground">{entry?.sop_reference ?? ''}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
      {exceptions.length > 0 && (
        <div className="mt-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Exceptions</p>
          {exceptions.map((e, i) => (
            <div key={i} className="flex items-start gap-2 text-sm text-amber-400">
              <HiOutlineExclamationTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{e}</span>
            </div>
          ))}
        </div>
      )}
      {sopRefs.length > 0 && (
        <div className="mt-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">SOP References</p>
          <div className="flex flex-wrap gap-1.5">
            {sopRefs.map((s, i) => (
              <Badge key={i} variant="outline" className="text-[10px]">{s}</Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================================================
// GRIEVANCE RESPONSE RENDERER
// ============================================================================

function GrievanceResponseCard({ data }: { data: GrievanceData }) {
  const nextSteps = Array.isArray(data?.next_steps) ? data.next_steps : []

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        {data?.grievance_id && (
          <Badge variant="outline" className="text-xs font-mono">{data.grievance_id}</Badge>
        )}
        {data?.type && (
          <Badge variant="secondary" className="text-xs">{data.type}</Badge>
        )}
        {data?.status && (
          <Badge className={cn('text-xs', getStatusColor(data.status))}>{data.status}</Badge>
        )}
      </div>
      {data?.action && (
        <div className="text-sm text-foreground/90">{renderMarkdown(data.action)}</div>
      )}
      {data?.details && (
        <div className="text-sm text-muted-foreground">{renderMarkdown(data.details)}</div>
      )}
      {data?.resolution_timeline && (
        <div className="bg-secondary/50 rounded-lg p-2.5 border border-border/50 flex items-center gap-2">
          <HiOutlineClock className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Expected Resolution:</span>
          <span className="text-sm font-medium">{data.resolution_timeline}</span>
        </div>
      )}
      {nextSteps.length > 0 && (
        <div className="mt-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Next Steps</p>
          <ol className="space-y-1.5">
            {nextSteps.map((step, i) => (
              <li key={i} className="text-sm text-foreground/80 flex items-start gap-2">
                <span className="text-xs font-mono text-emerald-400 mt-0.5 shrink-0">{i + 1}.</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  )
}

// ============================================================================
// CHAT DRAWER COMPONENT
// ============================================================================

function ChatDrawer({
  open,
  onOpenChange,
  agentId,
  agentName,
  agentDescription,
  renderResponse,
  sampleResponse,
  showSampleData,
  onActiveAgent,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  agentId: string
  agentName: string
  agentDescription: string
  renderResponse: (data: Record<string, unknown>) => React.ReactNode
  sampleResponse?: Record<string, unknown>
  showSampleData: boolean
  onActiveAgent: (id: string | null) => void
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const prevSampleRef = useRef(showSampleData)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, loading])

  useEffect(() => {
    if (showSampleData && !prevSampleRef.current && sampleResponse && messages.length === 0) {
      setMessages([
        { role: 'user', content: 'Show me the current procurement overview', timestamp: new Date() },
        { role: 'assistant', content: (sampleResponse as unknown as InsightsData)?.summary ?? 'Sample response loaded', data: sampleResponse, timestamp: new Date() },
      ])
    }
    if (!showSampleData && prevSampleRef.current) {
      setMessages([])
    }
    prevSampleRef.current = showSampleData
  }, [showSampleData, sampleResponse, messages.length])

  const handleSend = useCallback(async () => {
    if (!input.trim() || loading) return
    const userMsg = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: userMsg, timestamp: new Date() }])
    setLoading(true)
    onActiveAgent(agentId)

    try {
      const result = await callAIAgent(userMsg, agentId)
      if (result.success && result?.response?.result) {
        const agentData = result.response.result as Record<string, unknown>
        const contentText = (agentData?.summary as string) ?? (agentData?.details as string) ?? (agentData?.action as string) ?? 'Response received'
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: contentText,
          data: agentData,
          timestamp: new Date(),
        }])
      } else {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: result?.error ?? 'Failed to get response. Please try again.',
          timestamp: new Date(),
        }])
      }
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'An error occurred. Please try again.',
        timestamp: new Date(),
      }])
    }
    setLoading(false)
    onActiveAgent(null)
  }, [input, loading, agentId, onActiveAgent])

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col bg-background border-border">
        <SheetHeader className="px-4 pt-6 pb-3 border-b border-border">
          <SheetTitle className="text-foreground flex items-center gap-2">
            <HiOutlineSparkles className="w-5 h-5 text-emerald-400" />
            {agentName}
          </SheetTitle>
          <SheetDescription className="text-muted-foreground text-xs">
            {agentDescription}
          </SheetDescription>
        </SheetHeader>

        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {messages.length === 0 && !loading && (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center mb-3">
                <HiOutlineChatBubbleLeftRight className="w-6 h-6 text-emerald-400" />
              </div>
              <p className="text-sm font-medium text-foreground mb-1">Start a conversation</p>
              <p className="text-xs text-muted-foreground max-w-[250px]">
                Ask questions about procurement data, compliance, or submit requests.
              </p>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
              <div className={cn('max-w-[85%] rounded-xl px-3.5 py-2.5', msg.role === 'user' ? 'bg-emerald-600/20 border border-emerald-500/20 text-foreground' : 'bg-secondary border border-border text-foreground')}>
                {msg.role === 'assistant' && msg.data ? (
                  renderResponse(msg.data)
                ) : (
                  <p className="text-sm">{msg.content}</p>
                )}
                <p className="text-[10px] text-muted-foreground mt-1.5 text-right">
                  {msg.timestamp instanceof Date ? msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                </p>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-secondary border border-border rounded-xl px-4 py-3 flex items-center gap-2">
                <FiLoader className="w-4 h-4 text-emerald-400 animate-spin" />
                <span className="text-sm text-muted-foreground">Thinking...</span>
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-border px-4 py-3">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
              placeholder="Type your question..."
              className="flex-1 bg-secondary border-border text-foreground placeholder:text-muted-foreground text-sm"
              disabled={loading}
            />
            <Button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              size="icon"
              className="bg-emerald-600 hover:bg-emerald-700 text-white shrink-0"
            >
              <FiSend className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

// ============================================================================
// KPI CARD COMPONENT
// ============================================================================

function KpiCard({ icon, label, value, trend, trendUp }: { icon: React.ReactNode; label: string; value: string; trend: string; trendUp: boolean }) {
  return (
    <Card className="bg-card border-border shadow-lg shadow-black/10">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center">
            {icon}
          </div>
          <div className={cn('flex items-center gap-1 text-xs font-medium', trendUp ? 'text-emerald-400' : 'text-red-400')}>
            {trendUp ? <HiOutlineArrowTrendingUp className="w-3.5 h-3.5" /> : <HiOutlineArrowTrendingDown className="w-3.5 h-3.5" />}
            {trend}
          </div>
        </div>
        <p className="text-2xl font-bold tracking-tight mt-3">{value}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
      </CardContent>
    </Card>
  )
}

// ============================================================================
// PIPELINE STAGE COMPONENT
// ============================================================================

function PipelineStage({ stage, count, total, color }: { stage: string; count: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0
  return (
    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-medium text-foreground truncate">{stage}</span>
        <span className="text-xs text-muted-foreground ml-2">{count}</span>
      </div>
      <div className="h-2.5 bg-secondary rounded-full overflow-hidden">
        <div className={cn('h-full rounded-full transition-all duration-500', color)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

// ============================================================================
// DASHBOARD SCREEN
// ============================================================================

function DashboardScreen({ showSampleData }: { showSampleData: boolean }) {
  const data = showSampleData ? MOCK_PRS : []
  const stages = [
    { stage: 'Created', count: showSampleData ? 2 : 0, color: 'bg-sky-500' },
    { stage: 'DOA Review', count: showSampleData ? 4 : 0, color: 'bg-amber-500' },
    { stage: 'PO Generated', count: showSampleData ? 3 : 0, color: 'bg-emerald-500' },
    { stage: 'Goods Receipt', count: showSampleData ? 2 : 0, color: 'bg-purple-500' },
    { stage: 'Completed', count: showSampleData ? 1 : 0, color: 'bg-teal-500' },
  ]
  const total = stages.reduce((s, st) => s + st.count, 0)

  return (
    <div className="space-y-6">
      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <KpiCard icon={<HiOutlineClipboardDocumentList className="w-5 h-5 text-emerald-400" />} label="Total Active PRs" value={showSampleData ? '47' : '--'} trend={showSampleData ? '+8%' : '--'} trendUp={true} />
        <KpiCard icon={<HiOutlineDocumentText className="w-5 h-5 text-emerald-400" />} label="POs in Progress" value={showSampleData ? '23' : '--'} trend={showSampleData ? '+12%' : '--'} trendUp={true} />
        <KpiCard icon={<HiOutlineClock className="w-5 h-5 text-emerald-400" />} label="Avg TAT (days)" value={showSampleData ? '9.8' : '--'} trend={showSampleData ? '-12%' : '--'} trendUp={true} />
        <KpiCard icon={<HiOutlineBellAlert className="w-5 h-5 text-red-400" />} label="SLA Breaches" value={showSampleData ? '3' : '--'} trend={showSampleData ? '+1' : '--'} trendUp={false} />
        <KpiCard icon={<HiOutlineCheckCircle className="w-5 h-5 text-emerald-400" />} label="Pending Approvals" value={showSampleData ? '9' : '--'} trend={showSampleData ? '-15%' : '--'} trendUp={true} />
      </div>

      {/* Pipeline */}
      <Card className="bg-card border-border shadow-lg shadow-black/10">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold tracking-tight flex items-center gap-2">
            <HiOutlineArrowPath className="w-4 h-4 text-emerald-400" />
            Approval Pipeline
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-5">
          {showSampleData ? (
            <div className="flex gap-4 items-end">
              {stages.map((s, i) => (
                <React.Fragment key={s.stage}>
                  <PipelineStage stage={s.stage} count={s.count} total={total} color={s.color} />
                  {i < stages.length - 1 && (
                    <HiOutlineChevronRight className="w-4 h-4 text-muted-foreground shrink-0 mb-1" />
                  )}
                </React.Fragment>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center py-8 text-muted-foreground text-sm">
              Enable sample data to view the pipeline
            </div>
          )}
        </CardContent>
      </Card>

      {/* PR/PO Table */}
      <Card className="bg-card border-border shadow-lg shadow-black/10">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold tracking-tight flex items-center gap-2">
            <HiOutlineChartBar className="w-4 h-4 text-emerald-400" />
            Active Purchase Requisitions
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {showSampleData ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-xs text-muted-foreground font-semibold">PR #</TableHead>
                    <TableHead className="text-xs text-muted-foreground font-semibold">Requester</TableHead>
                    <TableHead className="text-xs text-muted-foreground font-semibold">Amount</TableHead>
                    <TableHead className="text-xs text-muted-foreground font-semibold">Current Stage</TableHead>
                    <TableHead className="text-xs text-muted-foreground font-semibold">TAT (days)</TableHead>
                    <TableHead className="text-xs text-muted-foreground font-semibold">SLA Status</TableHead>
                    <TableHead className="text-xs text-muted-foreground font-semibold">Last Updated</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((pr, i) => (
                    <TableRow key={pr.pr_number} className={cn('border-border', i % 2 === 0 ? 'bg-card' : 'bg-secondary/30')}>
                      <TableCell className="text-sm font-mono font-medium text-emerald-400">{pr.pr_number}</TableCell>
                      <TableCell className="text-sm">{pr.requester}</TableCell>
                      <TableCell className="text-sm font-medium">{pr.amount}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-[11px] font-medium">{pr.current_stage}</Badge>
                      </TableCell>
                      <TableCell className="text-sm">{pr.tat_days}</TableCell>
                      <TableCell>
                        <Badge className={cn('text-[11px]', getStatusColor(pr.sla_status))}>{pr.sla_status}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{pr.last_updated}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <HiOutlineChartBar className="w-10 h-10 text-muted-foreground/40 mb-3" />
              <p className="text-sm text-muted-foreground">No data to display</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Enable sample data or query the Insights Agent</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ============================================================================
// AUDIT & COMPLIANCE SCREEN
// ============================================================================

function AuditScreen({ showSampleData }: { showSampleData: boolean }) {
  const [filterPR, setFilterPR] = useState('')
  const [filterDOA, setFilterDOA] = useState('all')

  const filteredEvents = showSampleData
    ? MOCK_AUDIT_EVENTS.filter(e => {
        if (filterPR && !e.pr_po.toLowerCase().includes(filterPR.toLowerCase())) return false
        if (filterDOA !== 'all' && e.doa_level !== filterDOA) return false
        return true
      })
    : []

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card className="bg-card border-border shadow-lg shadow-black/10">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <HiOutlineFunnel className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-semibold tracking-tight">Filters</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">PR/PO Number</Label>
              <Input
                placeholder="e.g. PR-4521"
                value={filterPR}
                onChange={(e) => setFilterPR(e.target.value)}
                className="bg-secondary border-border text-sm"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">DOA Level</Label>
              <Select value={filterDOA} onValueChange={setFilterDOA}>
                <SelectTrigger className="bg-secondary border-border text-sm">
                  <SelectValue placeholder="All Levels" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="L1">L1</SelectItem>
                  <SelectItem value="L2">L2</SelectItem>
                  <SelectItem value="L3">L3</SelectItem>
                  <SelectItem value="-">System/Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button
                variant="outline"
                className="w-full border-border text-sm"
                onClick={() => { setFilterPR(''); setFilterDOA('all') }}
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audit Log Table */}
      <Card className="bg-card border-border shadow-lg shadow-black/10">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold tracking-tight flex items-center gap-2">
            <HiOutlineShieldCheck className="w-4 h-4 text-emerald-400" />
            Audit Trail Log
            {showSampleData && (
              <Badge variant="secondary" className="text-[10px] ml-2">{filteredEvents.length} events</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {showSampleData ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-xs text-muted-foreground font-semibold">PR/PO</TableHead>
                    <TableHead className="text-xs text-muted-foreground font-semibold">Event</TableHead>
                    <TableHead className="text-xs text-muted-foreground font-semibold">Actor</TableHead>
                    <TableHead className="text-xs text-muted-foreground font-semibold">Timestamp</TableHead>
                    <TableHead className="text-xs text-muted-foreground font-semibold">DOA Level</TableHead>
                    <TableHead className="text-xs text-muted-foreground font-semibold">SOP Reference</TableHead>
                    <TableHead className="text-xs text-muted-foreground font-semibold">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEvents.map((ev, i) => (
                    <TableRow key={i} className={cn('border-border', i % 2 === 0 ? 'bg-card' : 'bg-secondary/30')}>
                      <TableCell className="text-sm font-mono font-medium text-emerald-400">{ev.pr_po}</TableCell>
                      <TableCell className="text-sm">{ev.event}</TableCell>
                      <TableCell className="text-sm">{ev.actor}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{ev.timestamp}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[11px] font-mono">{ev.doa_level}</Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{ev.sop_reference}</TableCell>
                      <TableCell>
                        <Badge className={cn('text-[11px]', getStatusColor(ev.status))}>{ev.status}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <HiOutlineShieldCheck className="w-10 h-10 text-muted-foreground/40 mb-3" />
              <p className="text-sm text-muted-foreground">No audit events to display</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Enable sample data or query the Compliance Agent</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ============================================================================
// GRIEVANCES SCREEN
// ============================================================================

function GrievancesScreen({ showSampleData }: { showSampleData: boolean }) {
  const openCount = showSampleData ? MOCK_GRIEVANCES.filter(g => g.status === 'Open').length : 0
  const inProgressCount = showSampleData ? MOCK_GRIEVANCES.filter(g => g.status === 'In Progress').length : 0
  const resolvedCount = showSampleData ? MOCK_GRIEVANCES.filter(g => g.status === 'Resolved').length : 0
  const overdueCount = showSampleData ? MOCK_GRIEVANCES.filter(g => g.status === 'Overdue').length : 0

  const summaryCards = [
    { label: 'Open', count: openCount, icon: <FiAlertCircle className="w-5 h-5" />, color: 'text-amber-400', bg: 'bg-amber-500/10' },
    { label: 'In Progress', count: inProgressCount, icon: <FiClock className="w-5 h-5" />, color: 'text-sky-400', bg: 'bg-sky-500/10' },
    { label: 'Resolved', count: resolvedCount, icon: <FiCheckCircle className="w-5 h-5" />, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { label: 'Overdue', count: overdueCount, icon: <HiOutlineExclamationTriangle className="w-5 h-5" />, color: 'text-red-400', bg: 'bg-red-500/10' },
  ]

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((c) => (
          <Card key={c.label} className="bg-card border-border shadow-lg shadow-black/10">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', c.bg)}>
                <span className={c.color}>{c.icon}</span>
              </div>
              <div>
                <p className="text-2xl font-bold tracking-tight">{showSampleData ? c.count : '--'}</p>
                <p className="text-xs text-muted-foreground">{c.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Grievance Table */}
      <Card className="bg-card border-border shadow-lg shadow-black/10">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold tracking-tight flex items-center gap-2">
            <LuMessageSquareWarning className="w-4 h-4 text-emerald-400" />
            Grievance Tracker
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {showSampleData ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-xs text-muted-foreground font-semibold">ID</TableHead>
                    <TableHead className="text-xs text-muted-foreground font-semibold">Type</TableHead>
                    <TableHead className="text-xs text-muted-foreground font-semibold">Related PR/PO</TableHead>
                    <TableHead className="text-xs text-muted-foreground font-semibold">Submitted By</TableHead>
                    <TableHead className="text-xs text-muted-foreground font-semibold">Date</TableHead>
                    <TableHead className="text-xs text-muted-foreground font-semibold">Priority</TableHead>
                    <TableHead className="text-xs text-muted-foreground font-semibold">Status</TableHead>
                    <TableHead className="text-xs text-muted-foreground font-semibold">Assigned To</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {MOCK_GRIEVANCES.map((g, i) => (
                    <TableRow key={g.id} className={cn('border-border', i % 2 === 0 ? 'bg-card' : 'bg-secondary/30')}>
                      <TableCell className="text-sm font-mono font-medium text-emerald-400">{g.id}</TableCell>
                      <TableCell className="text-sm">{g.type}</TableCell>
                      <TableCell className="text-sm font-mono">{g.related_pr_po}</TableCell>
                      <TableCell className="text-sm">{g.submitted_by}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{g.date}</TableCell>
                      <TableCell>
                        <Badge className={cn('text-[11px]', getPriorityColor(g.priority))}>{g.priority}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={cn('text-[11px]', getStatusColor(g.status))}>{g.status}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{g.assigned_to}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <LuMessageSquareWarning className="w-10 h-10 text-muted-foreground/40 mb-3" />
              <p className="text-sm text-muted-foreground">No grievances to display</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Enable sample data or raise a grievance via the agent</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

export default function Page() {
  const [activeScreen, setActiveScreen] = useState<ScreenType>('dashboard')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [showSampleData, setShowSampleData] = useState(false)
  const [activeAgentId, setActiveAgentId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  // Chat drawer states
  const [insightsChatOpen, setInsightsChatOpen] = useState(false)
  const [complianceChatOpen, setComplianceChatOpen] = useState(false)
  const [grievanceChatOpen, setGrievanceChatOpen] = useState(false)

  const navItems = [
    { id: 'dashboard' as ScreenType, label: 'Dashboard', icon: <LuLayoutDashboard className="w-5 h-5" /> },
    { id: 'audit' as ScreenType, label: 'Audit & Compliance', icon: <HiOutlineShieldCheck className="w-5 h-5" /> },
    { id: 'grievances' as ScreenType, label: 'Grievances', icon: <LuMessageSquareWarning className="w-5 h-5" /> },
  ]

  const screenTitles: Record<ScreenType, string> = {
    dashboard: 'Procurement Dashboard',
    audit: 'Audit & Compliance',
    grievances: 'Grievance Management',
  }

  const getChatConfig = useCallback(() => {
    if (activeScreen === 'dashboard') {
      return {
        open: insightsChatOpen,
        setOpen: setInsightsChatOpen,
        agentId: AGENT_IDS.INSIGHTS,
        agentName: 'Procurement Insights',
        agentDesc: 'Ask about PR/PO statuses, TAT metrics, SLA compliance, and bottlenecks.',
        renderFn: (data: Record<string, unknown>) => <InsightsResponseCard data={data as unknown as InsightsData} />,
        sample: SAMPLE_INSIGHTS as unknown as Record<string, unknown>,
      }
    }
    if (activeScreen === 'audit') {
      return {
        open: complianceChatOpen,
        setOpen: setComplianceChatOpen,
        agentId: AGENT_IDS.COMPLIANCE,
        agentName: 'Compliance Trail',
        agentDesc: 'Query DOA approval records, SOP compliance history, and audit summaries.',
        renderFn: (data: Record<string, unknown>) => <ComplianceResponseCard data={data as unknown as ComplianceData} />,
        sample: SAMPLE_COMPLIANCE as unknown as Record<string, unknown>,
      }
    }
    return {
      open: grievanceChatOpen,
      setOpen: setGrievanceChatOpen,
      agentId: AGENT_IDS.GRIEVANCE,
      agentName: 'Grievance Agent',
      agentDesc: 'Raise grievances, check resolution status, and track next steps.',
      renderFn: (data: Record<string, unknown>) => <GrievanceResponseCard data={data as unknown as GrievanceData} />,
      sample: SAMPLE_GRIEVANCE as unknown as Record<string, unknown>,
    }
  }, [activeScreen, insightsChatOpen, complianceChatOpen, grievanceChatOpen])

  const currentChat = getChatConfig()

  const chatButtonLabels: Record<ScreenType, string> = {
    dashboard: 'Ask Insights',
    audit: 'Query Audit Trail',
    grievances: 'Raise / Check Grievance',
  }

  return (
    <PageErrorBoundary>
      <TooltipProvider>
        <div className="min-h-screen bg-background text-foreground flex">
          {/* ========== SIDEBAR ========== */}
          <aside className={cn('h-screen sticky top-0 flex flex-col border-r border-border bg-card transition-all duration-300 shrink-0', sidebarCollapsed ? 'w-16' : 'w-56')}>
            {/* Logo */}
            <div className={cn('flex items-center h-14 border-b border-border px-3', sidebarCollapsed ? 'justify-center' : 'gap-2.5')}>
              <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center shrink-0">
                <FiActivity className="w-4 h-4 text-white" />
              </div>
              {!sidebarCollapsed && (
                <span className="text-sm font-bold tracking-tight">ProcureTrack</span>
              )}
            </div>

            {/* Nav */}
            <nav className="flex-1 py-3 px-2 space-y-1">
              {navItems.map((item) => (
                <Tooltip key={item.id} delayDuration={0}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => setActiveScreen(item.id)}
                      className={cn(
                        'w-full flex items-center gap-2.5 rounded-lg text-sm font-medium transition-colors duration-150',
                        sidebarCollapsed ? 'justify-center p-2.5' : 'px-3 py-2.5',
                        activeScreen === item.id
                          ? 'bg-emerald-500/15 text-emerald-400'
                          : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                      )}
                    >
                      {item.icon}
                      {!sidebarCollapsed && <span>{item.label}</span>}
                    </button>
                  </TooltipTrigger>
                  {sidebarCollapsed && (
                    <TooltipContent side="right" className="text-xs">
                      {item.label}
                    </TooltipContent>
                  )}
                </Tooltip>
              ))}
            </nav>

            {/* Collapse Toggle */}
            <div className="border-t border-border p-2">
              <button
                onClick={() => setSidebarCollapsed(prev => !prev)}
                className="w-full flex items-center justify-center p-2 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
              >
                {sidebarCollapsed ? <HiOutlineChevronRight className="w-4 h-4" /> : <HiOutlineChevronLeft className="w-4 h-4" />}
              </button>
            </div>

            {/* Agent Status (sidebar bottom) */}
            {!sidebarCollapsed && (
              <div className="border-t border-border p-3">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-2">Agents</p>
                <div className="space-y-1.5">
                  {AGENTS_INFO.map((a) => (
                    <div key={a.id} className="flex items-center gap-2">
                      <div className={cn('w-1.5 h-1.5 rounded-full shrink-0', activeAgentId === a.id ? 'bg-emerald-400 animate-pulse' : 'bg-muted-foreground/40')} />
                      <Tooltip delayDuration={0}>
                        <TooltipTrigger asChild>
                          <span className="text-[11px] text-muted-foreground truncate cursor-default">{a.name.replace(' Agent', '')}</span>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="text-xs max-w-[200px]">
                          {a.purpose}
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </aside>

          {/* ========== MAIN ========== */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Header */}
            <header className="h-14 sticky top-0 z-30 flex items-center justify-between px-4 lg:px-6 border-b border-border bg-card/80 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <button
                  className="lg:hidden p-1.5 rounded-lg hover:bg-secondary text-muted-foreground"
                  onClick={() => setSidebarCollapsed(prev => !prev)}
                >
                  <HiOutlineBars3 className="w-5 h-5" />
                </button>
                <h1 className="text-sm font-semibold tracking-tight">{screenTitles[activeScreen]}</h1>
              </div>

              <div className="flex items-center gap-3">
                {/* Search */}
                <div className="hidden sm:flex items-center bg-secondary rounded-lg px-3 py-1.5 gap-2 border border-border w-56">
                  <HiOutlineMagnifyingGlass className="w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search PR, PO, Grievance..."
                    className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none w-full"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                {/* Sample Data Toggle */}
                <div className="flex items-center gap-2">
                  <Label htmlFor="sample-toggle" className="text-xs text-muted-foreground cursor-pointer hidden sm:block">Sample Data</Label>
                  <Switch
                    id="sample-toggle"
                    checked={showSampleData}
                    onCheckedChange={setShowSampleData}
                    className="data-[state=checked]:bg-emerald-600"
                  />
                </div>

                {/* User Avatar */}
                <div className="w-8 h-8 rounded-full bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center">
                  <HiOutlineUser className="w-4 h-4 text-emerald-400" />
                </div>
              </div>
            </header>

            {/* Content */}
            <main className="flex-1 overflow-y-auto p-4 lg:p-6">
              {activeScreen === 'dashboard' && <DashboardScreen showSampleData={showSampleData} />}
              {activeScreen === 'audit' && <AuditScreen showSampleData={showSampleData} />}
              {activeScreen === 'grievances' && <GrievancesScreen showSampleData={showSampleData} />}

              {/* Agent Info Section */}
              <Card className="bg-card border-border shadow-lg shadow-black/10 mt-6">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <HiOutlineInformationCircle className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Powered by AI Agents</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {AGENTS_INFO.map((a) => (
                      <div key={a.id} className="flex items-start gap-2.5 bg-secondary/50 rounded-lg p-3 border border-border/50">
                        <div className={cn('w-2 h-2 rounded-full mt-1.5 shrink-0', activeAgentId === a.id ? 'bg-emerald-400 animate-pulse' : 'bg-muted-foreground/40')} />
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-foreground truncate">{a.name}</p>
                          <p className="text-[11px] text-muted-foreground leading-relaxed mt-0.5">{a.purpose}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </main>
          </div>

          {/* ========== FLOATING ACTION BUTTON ========== */}
          <button
            onClick={() => currentChat.setOpen(true)}
            className="fixed bottom-6 right-6 z-40 flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-3 rounded-xl shadow-lg shadow-emerald-900/30 transition-all duration-200 hover:scale-105"
          >
            <HiOutlineSparkles className="w-5 h-5" />
            <span className="text-sm font-semibold">{chatButtonLabels[activeScreen]}</span>
          </button>

          {/* ========== CHAT DRAWER ========== */}
          <ChatDrawer
            open={currentChat.open}
            onOpenChange={currentChat.setOpen}
            agentId={currentChat.agentId}
            agentName={currentChat.agentName}
            agentDescription={currentChat.agentDesc}
            renderResponse={currentChat.renderFn}
            sampleResponse={currentChat.sample}
            showSampleData={showSampleData}
            onActiveAgent={setActiveAgentId}
          />
        </div>
      </TooltipProvider>
    </PageErrorBoundary>
  )
}
