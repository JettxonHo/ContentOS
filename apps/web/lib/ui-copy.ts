import type {
  ContentModeDto,
  ContentPackageModeDto,
  ContentPackageOutputDto,
  ResearchReviewStateDto,
  SourceRoleDto,
  SourceTypeDto,
} from '@contentos/contracts';

export const UI_COPY = {
  shell: {
    dashboard: '工作台',
    settings: '设置',
    unavailable: '未开放',
    owner: '私有创作空间',
    logout: '退出登录',
  },
  stage: {
    details: '项目信息',
    sources: '资料',
    research: '研究',
    opinionBlog: '观点与文章',
    xiaohongshu: '小红书',
  },
  status: {
    loading: '读取中',
    ready: '可开始',
    in_review: '待审核',
    approved: '已批准',
    outdated: '需更新',
    blocked: '未就绪',
  },
  artifact: {
    workingCopy: '当前草稿',
    version: '版本',
    checkpoint: '保存为版本',
    approve: '批准此版本',
    activity: '运行记录',
    freshCandidate: '生成新版候选',
  },
} as const;

export const CONTENT_MODE_LABEL: Record<ContentPackageModeDto | ContentModeDto, string> = {
  deferred: '稍后决定',
  creator_led: '创作者主导',
  research_based: '研究驱动',
};

export const OUTPUT_LABEL: Record<ContentPackageOutputDto, string> = {
  blog: '文章',
  xiaohongshu: '小红书',
};

export const SOURCE_ROLE_LABEL: Record<SourceRoleDto, string> = {
  primary: '主资料',
  supporting: '补充资料',
};

export const SOURCE_TYPE_LABEL: Record<SourceTypeDto, string> = {
  pasted_text: '粘贴文本',
  uploaded_text: '上传文件',
  public_url: '网页链接',
};

export const RESEARCH_REVIEW_LABEL: Record<ResearchReviewStateDto, string> = {
  unreviewed: '未审核',
  accepted: '接受',
  corrected: '已修正',
  excluded: '排除',
  needs_verification: '待核验',
};

export function formatZhDate(value: string | Date): string {
  const date = value instanceof Date ? value : new Date(value);
  const pad = (part: number): string => String(part).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
