import type {
    SYSTEM_MODE,
    DARK_MODE,
    LIGHT_MODE,
    WALLPAPER_FULLSCREEN,
    WALLPAPER_BANNER,
    WALLPAPER_NONE
} from "@constants/constants";


/**
 * 
 */

// Analytics 配置
export type AnalyticsConfig = {
    enabled: boolean;
    platform: "umami";
    umami: {
        apiKey: string;
        baseUrl: string;
        code: string;
    };
};

/**
 * 
 */

// Favicon 配置
export type Favicon = {
    src: string;
    theme?: "light" | "dark";
    sizes?: string;
};


// 加载页配置
export type LoadingOverlayConfig = {
    // 是否启用加载页
    enable: boolean;
    // 是否等待所有资源加载完成; 若设置为 false，则会在 DOM 解析完成后立即关闭加载页
    waitForAllResources: boolean;
    // 加载标题配置
    title: {
        // 是否启用加载标题
        enable: boolean;
        // 加载标题文本
        content: string;
        // 动画周期 (s)
        interval: number;
    };
    // 加载动画配置
    spinner: {
        // 是否启用加载动画
        enable: boolean;
        // 动画周期 (s)
        interval: number;
    };
};


// 站点配置
export type SiteConfig = {
    // 站点 URL (以斜杠结尾) 
    siteURL: string;
    // 站点标题
    title: string;
    // 站点副标题
    subtitle: string;
    // 站点关键词，用于生成 <meta name="keywords">
    keywords?: string[];
    // 语言配置
    lang: "zh" | "en" | "ko" | "ja" | "es" | "th" | "vi" | "tr" | "id" | "fr" | "de" | "ru" | "ar";
    // 翻译配置
    translate?: {
        // 启用翻译功能
        enable: boolean;
        // 翻译服务类型，如 'client.edge'
        service?: string;
        // 显示语言选择下拉框
        showSelectTag?: boolean;
        // 自动识别用户语言
        autoDiscriminate?: boolean;
        // 翻译时忽略的 CSS 类名
        ignoreClasses?: string[];
        // 翻译时忽略的 HTML 标签
        ignoreTags?: string[];
    };
    // 时区配置
    timeZone: -12 | -11 | -10 | -9 | -8 | -7 | -6 | -5 | -4 | -3 | -2 | -1 | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
    // 字体配置
    font: {
        [key: string]: {
            // 字体源 (字体 CSS 链接 | 字体文件路径)
            src: string;
            // 字体名 (font-family)
            family: string;
        };
    };
    // 主题色配置
    themeColor: {
        // 主题色的默认色相 (0-360)
        hue: number;
    };
    // 默认主题
    defaultTheme: "system" | "light" | "dark";
    // 壁纸配置
    wallpaper: {
        // 模式
        mode: "fullscreen" | "banner" | "none";
        src: // 图片源配置 (fullscreen 和 banner 模式共享) 
        | string
        | string[]
        | {
            desktop?: string | string[];
            mobile?: string | string[];
        };
        // 壁纸位置，等同于 object-position
        position?: "top" | "center" | "bottom";
        // 轮播配置 (fullscreen 和 banner 模式共享)
        carousel?: {
            // 为多张图片启用轮播，否则随机显示一张图片
            enable: boolean;
            // 轮播间隔时间 (s) 
            interval: number;
            // 启用 Ken Burns 效果
            kenBurns?: boolean;
        };
        // Banner 模式专属配置
        banner?: {
            homeText?: {
                // 在主页显示文本
                enable: boolean;
                // 主标题
                title?: string;
                // 副标题
                subtitle?: string | string[]; // 支持单个字符串或字符串数组
                // 副标题打字机效果
                typewriter?: {
                    // 启用副标题打字机效果
                    enable: boolean;
                    // 打字速度 (ms)
                    speed: number;
                    // 删除速度 (ms)
                    deleteSpeed: number;
                    // 完全显示后的暂停时间 (ms)
                    pauseTime: number;
                };
            };
            // 横幅图片来源文本
            credit?: {
                // 显示横幅图片来源文本
                enable: boolean;
                // 要显示的来源文本
                text: string;
                // (可选) 原始艺术品或艺术家页面的 URL 链接
                url?: string;
            };
            // 导航栏配置
            navbar?: {
                // 导航栏透明模式
                transparentMode?: "semi" | "full" | "semifull";
            };
            // 水波纹效果配置
            waves?: {
                // 启用水波纹效果
                enable: boolean;
                // 启用性能模式 (简化波浪效果以提升性能)
                performanceMode?: boolean;
            };
        };
        // Fullscreen 模式专属配置
        fullscreen?: {
            // 层级
            zIndex?: number;
            // 壁纸透明度，0-1 之间
            opacity?: number;
            // 背景模糊程度 (px)
            blur?: number;
            // 导航栏透明模式
            navbar?: {
                transparentMode?: "semi" | "full" | "semifull";
            };
        };
    };
    // 加载页配置
    loadingOverlay?: LoadingOverlayConfig;
    // Favicon 配置
    favicon: Favicon[];
    // bangumi 配置
    bangumi?: {
        // 用户 ID
        userId?: string;
    };
    // OpenGraph 配置
    generateOgImages: boolean;
};

/**
 * 
 */

export type LIGHT_DARK_MODE =
    | typeof LIGHT_MODE
    | typeof DARK_MODE
    | typeof SYSTEM_MODE;


export type WALLPAPER_MODE =
    | typeof WALLPAPER_FULLSCREEN
    | typeof WALLPAPER_BANNER
    | typeof WALLPAPER_NONE;

/**
 * 
 */

export enum LinkPreset {
    Home = 0,
    Archive = 1,
    Projects = 2,
    Skills = 3,
    Timeline = 4,
    Diary = 5,
    Albums = 6,
    Anime = 7,
    About = 8,
    Friends = 9,
}


export type NavbarLink = {
    // 链接名称
    name: string;
    // 链接
    url: string;
    // 是否为外部链接
    external?: boolean;
    // 链接图标
    icon?: string;
    // 中转页描述
    description?: string;
    // 子链接，可以是NavbarLink或LinkPreset
    children?: (NavbarLink | LinkPreset)[];
};


// 导航栏配置
export type NavbarConfig = {
    // 链接配置
    links: (NavbarLink | LinkPreset)[]; // 支持多级菜单
};

/**
 * 
 */

export type WidgetComponentType =
    | "profile"
    | "announcement"
    | "directory"
    | "categories"
    | "tags"
    | "statistics"
    | "toc"
    | "custom";


export type WidgetComponentConfig = {
    // 组件类型
    type: WidgetComponentType;
    // 启用该组件
    enable: boolean;
    // 组件位置
    position: "top" | "sticky"; // 顶部固定区域或粘性区域
    // 自定义内联样式
    style?: string;
    // 页面可见性配置
    visibility?: {
        // 匹配模式：'include' (包含), 'exclude' (排除)
        mode: "include" | "exclude";
        // 页面路径匹配规则列表 (支持正则字符串)
        paths: string[];
    };
    // 响应式配置
    responsive?: {
        // 在指定设备上隐藏
        hidden?: ("mobile" | "tablet" | "desktop")[];
        // 折叠阈值
        collapseThreshold?: number;
    };
    // 目录深度 (仅用于 toc 和 categories 组件)
    depth?: number;
};


// 资料配置
export type ProfileConfig = {
    // 头像配置
    avatar?: string;
    // 信息配置
    name: string;
    // 简介配置
    bio?: string;
    // 链接配置
    links: {
        name: string;
        url: string;
        icon: string;
    }[];
};


// 公告配置
export type AnnouncementConfig = {
    // 公告标题
    title?: string;
    // 公告内容
    content: string;
    // 公告类型
    type?: "info" | "warning" | "success" | "error";
    // 公告栏图标
    icon?: string;
    // 允许用户关闭公告
    closable?: boolean;
    // 链接配置
    link?: {
        // 启用链接
        enable: boolean;
        // 链接文本
        text: string;
        // 链接 URL
        url: string;
        // 是否外部链接
        external?: boolean;
    };
};


// 侧边栏配置
export type SidebarConfig = {
    // 侧边栏组件配置列表
    components: {
        left: WidgetComponentConfig[];
        right: WidgetComponentConfig[];
    };
};

/**
 * 
 */

export type BlogPostData = {
    body: string;
    title: string;
    published: Date;
    description: string;
    tags: string[];
    draft?: boolean;
    image?: string;
    category?: string;
    pinned?: boolean;
    prevTitle?: string;
    prevSlug?: string;
    nextTitle?: string;
    nextSlug?: string;
};


// 文章配置
export type PostConfig = {
    // 显示“上次编辑”卡片
    showLastModified: boolean;
    // 代码高亮配置
    expressiveCode: {
        // 主题
        theme: string;
    };
    // 许可证配置
    license: {
        // 启用许可证
        enable: boolean;
        // 许可证名称
        name: string;
        // 许可证链接
        url: string;
    };
    // 评论配置
    comment: {
        // 启用评论功能
        enable: boolean;
        // Twikoo 评论系统配置
        twikoo?: {
            // 环境 ID
            envId: string;
            // 地域
            region?: string;
            // 语言
            lang?: string;
        };
    };
};

/**
 * 
 */

// 页脚配置
export type FooterConfig = {
    // 是否启用 Footer HTML 注入功能
    enable: boolean;
    // 自定义 HTML 内容，用于添加备案号等信息
    customHtml?: string;
};


/**
 * 
 */
