import {
  Dna,
  Brain,
  Scissors,
  ShieldCheck,
  HeartPulse,
  FileText,
  Upload,
  FlaskConical,
  LayoutDashboard,
  BarChart3,
  UserCircle,
  Settings,
  ShieldAlert,
  BookOpen,
  HelpCircle,
  Library,
} from "lucide-react";
import type {
  NavLink,
  StatItem,
  FeatureCard,
  ProcessStep,
  Testimonial,
  FooterLinkColumn,
  SidebarNavItem,
} from "@/types";


export const NAV_LINKS: NavLink[] = [
  { label: "Features", href: "#features" },
  { label: "Research", href: "#research" },
  { label: "About", href: "#about" },
  { label: "Contact", href: "#contact" },
];

export const HERO_STATS: StatItem[] = [
  { value: "98.7%", label: "Accuracy Rate" },
  { value: "2,400+", label: "Disorders Detected" },
  { value: "14,200", label: "Families Helped" },
];

export const BANNER_STATS: StatItem[] = [
  { value: "2,400+", label: "Genetic Disorders Covered" },
  { value: "98.7%", label: "Diagnostic Accuracy" },
  { value: "14,200", label: "Families Helped" },
  { value: "47", label: "Clinical Partners" },
];

export const FEATURE_CARDS: FeatureCard[] = [
  {
    icon: Dna,
    iconBgClass: "bg-blue-50",
    iconColorClass: "text-blue-600",
    title: "Whole Genome Sequencing",
    description:
      "Upload raw FASTQ, VCF, or BAM files. Our pipeline processes 6 billion base pairs with 99.9% coverage accuracy.",
  },
  {
    icon: Brain,
    iconBgClass: "bg-purple-50",
    iconColorClass: "text-purple-500",
    title: "Deep Learning Analysis",
    description:
      "Transformer-based models trained on 4.2M genomic profiles detect pathogenic variants across 2,400+ disorders.",
  },
  {
    icon: Scissors,
    iconBgClass: "bg-teal-50",
    iconColorClass: "text-teal-600",
    title: "CRISPR Recommendations",
    description:
      "Targeted CRISPR-Cas9 edit recommendations with off-target scoring and clinical evidence grades A–D.",
  },
  {
    icon: ShieldCheck,
    iconBgClass: "bg-amber-50",
    iconColorClass: "text-amber-500",
    title: "Privacy by Design",
    description:
      "HIPAA-compliant, end-to-end encrypted. Your genomic data never leaves your secure environment.",
  },
  {
    icon: HeartPulse,
    iconBgClass: "bg-pink-50",
    iconColorClass: "text-pink-500",
    title: "Prenatal Risk Profiling",
    description:
      "Integrates maternal and paternal genomes with population epidemiology for compound heterozygosity analysis.",
  },
  {
    icon: FileText,
    iconBgClass: "bg-sky-50",
    iconColorClass: "text-sky-500",
    title: "Clinical-Grade Reports",
    description:
      "Structured reports formatted for genetic counselors, OB-GYNs, and maternal-fetal medicine specialists.",
  },
];

export const PROCESS_STEPS: ProcessStep[] = [
  {
    step: 1,
    icon: Upload,
    title: "Upload Genomic Data",
    description:
      "Submit VCF, FASTQ, or BAM files from whole-genome or exome sequencing of both parents.",
  },
  {
    step: 2,
    icon: Brain,
    title: "AI Deep Analysis",
    description:
      "Our PreGeneNet-v4 model scans 23,000+ genes for pathogenic variants, carrier states, and compound heterozygosity.",
  },
  {
    step: 3,
    icon: FlaskConical,
    title: "Receive CRISPR Plan",
    description:
      "Get targeted gene editing recommendations with confidence scores, off-target rates, and clinical evidence grades.",
  },
];

export const TESTIMONIALS: Testimonial[] = [
  {
    quote:
      "PreGene-AI detected a compound heterozygous CFTR mutation that standard carrier screening missed. The CRISPR recommendation protocol was precisely what we needed.",
    initials: "SN",
    name: "Dr. Sarah Nakamura",
    role: "MFM Specialist, Stanford Medical",
  },
  {
    quote:
      "The report format integrates directly into our Epic workflow. Our genetic counseling team can review findings in minutes rather than days.",
    initials: "MW",
    name: "Dr. Marcus Williams",
    role: "Clinical Geneticist, Mayo Clinic",
  },
  {
    quote:
      "As a parent, seeing the risk breakdown explained clearly — with actionable options — gave us the confidence to make truly informed decisions about our pregnancy.",
    initials: "AP",
    name: "Aisha Patel",
    role: "Patient & Advocate",
  },
];

export const FOOTER_COLUMNS: FooterLinkColumn[] = [
  {
    heading: "Platform",
    links: [
      { label: "Features", href: "#features" },
      { label: "AI Analysis", href: "#" },
      { label: "CRISPR Engine", href: "#" },
      { label: "Reports", href: "#" },
      { label: "API", href: "#" },
    ],
  },
  {
    heading: "Clinical",
    links: [
      { label: "Research", href: "#research" },
      { label: "Validation Studies", href: "#" },
      { label: "Case Reports", href: "#" },
      { label: "Partners", href: "#" },
      { label: "Ethics", href: "#" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "About", href: "#about" },
      { label: "Blog", href: "#" },
      { label: "Careers", href: "#" },
      { label: "Contact", href: "#contact" },
      { label: "Privacy", href: "#" },
    ],
  },
];

export const FOOTER_LEGAL_LINKS: NavLink[] = [
  { label: "Privacy Policy", href: "#" },
  { label: "Terms of Use", href: "#" },
  { label: "HIPAA Compliance", href: "#" },
];

export const FOOTER_DISCLAIMER =
  "\u00A9 2025 PreGene-AI Inc. For investigational use only. Not FDA approved.";

/* ------------------------------------------------------------------ */
/* Authenticated app shell                                             */
/* ------------------------------------------------------------------ */

export const SIDEBAR_NAV_ITEMS: SidebarNavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Upload DNA", href: "/upload", icon: Upload },
  { label: "AI Analysis", href: "/analysis", icon: FlaskConical },
  { label: "CRISPR Recommendations", href: "/crispr-recommendations", icon: Scissors },
  { label: "Disease Library", href: "/disease-library", icon: Library },
  { label: "Reports", href: "/reports", icon: BarChart3 },
  { label: "Research", href: "/research", icon: BookOpen },
  { label: "Profile", href: "/profile", icon: UserCircle },
  { label: "Settings", href: "/settings", icon: Settings },
  { label: "Help", href: "/help", icon: HelpCircle },
];