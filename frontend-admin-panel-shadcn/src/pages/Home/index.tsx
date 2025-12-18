import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getToken } from '@/utils/request';
import { getTheme } from '@/utils/theme';
import { InfiniteSlider } from '@/components/motion-primitives/infinite-slider';
import { Button } from '@/components/ui/button';
// Light theme logos
import appleMusicLogoLight from '@/assets/company-logo-light/apple-music-3.svg';
import chromeLogoLight from '@/assets/company-logo-light/google-chrome-3.svg';
import netflixLogoLight from '@/assets/company-logo-light/netflix-3.svg';
import xboxLogoLight from '@/assets/company-logo-light/xbox-2.svg';
import cloudflareLogoLight from '@/assets/company-logo-light/cloudflare-1.svg';
import nintendoLogoLight from '@/assets/company-logo-light/nintendo-2.svg';
import deepseekLogoLight from '@/assets/company-logo-light/deepseek-ai-seeklogo.svg';
import openaiLogoLight from '@/assets/company-logo-light/openai-logo-1.svg';
// Dark theme logos
import appleMusicLogoDark from '@/assets/company-logo-dark/apple-music-3.svg';
import chromeLogoDark from '@/assets/company-logo-dark/google-chrome-3.svg';
import netflixLogoDark from '@/assets/company-logo-dark/netflix-3.svg';
import xboxLogoDark from '@/assets/company-logo-dark/xbox-2.svg';
import cloudflareLogoDark from '@/assets/company-logo-dark/cloudflare-1.svg';
import nintendoLogoDark from '@/assets/company-logo-dark/nintendo-2.svg';
import deepseekLogoDark from '@/assets/company-logo-dark/deepseek-ai-seeklogo.svg';
import openaiLogoDark from '@/assets/company-logo-dark/openai-logo-1.svg';

export default function HomePage() {
  const navigate = useNavigate();
  const [theme, setTheme] = useState<'light' | 'dark'>(getTheme());

  useEffect(() => {
    // 检查登录状态
    const token = getToken();
    if (!token) {
      // 未登录，跳转到登录页
      navigate('/login');
    }
  }, [navigate]);

  // 监听主题变化
  useEffect(() => {
    const handleThemeChange = () => {
      setTheme(getTheme());
    };
    
    // 监听 storage 事件（跨标签页同步）
    window.addEventListener('storage', handleThemeChange);
    
    // 监听自定义主题变化事件
    window.addEventListener('themechange', handleThemeChange);
    
    return () => {
      window.removeEventListener('storage', handleThemeChange);
      window.removeEventListener('themechange', handleThemeChange);
    };
  }, []);

  // 根据主题选择对应的 logo
  const appleMusicLogo = theme === 'dark' ? appleMusicLogoDark : appleMusicLogoLight;
  const chromeLogo = theme === 'dark' ? chromeLogoDark : chromeLogoLight;
  const netflixLogo = theme === 'dark' ? netflixLogoDark : netflixLogoLight;
  const xboxLogo = theme === 'dark' ? xboxLogoDark : xboxLogoLight;
  const cloudflareLogo = theme === 'dark' ? cloudflareLogoDark : cloudflareLogoLight;
  const nintendoLogo = theme === 'dark' ? nintendoLogoDark : nintendoLogoLight;
  const deepseekLogo = theme === 'dark' ? deepseekLogoDark : deepseekLogoLight;
  const openaiLogo = theme === 'dark' ? openaiLogoDark : openaiLogoLight;

  return (
    <div className="flex min-h-[calc(100vh-8rem)] flex-col items-center justify-center space-y-12 w-full">
      <div className="text-center space-y-4">
        <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight">
          Charno Admin.
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground mt-8">
          定制开发 · 数据驱动 · 业务增长
        </p>
      </div>
        <div className="w-full max-w-6xl px-4">
          <p className="text-lg md:text-xl text-muted-foreground mt-8 mb-6 text-center">
            我们与全球领先企业
          </p>
          <InfiniteSlider gap={24} reverse className="w-full">
          <img
            src={appleMusicLogo}
            alt="Apple Music logo"
            className="h-[120px] w-auto max-w-[200px] object-contain"
          />
          <img
            src={chromeLogo}
            alt="Chrome logo"
            className="h-[120px] w-auto max-w-[200px] object-contain"
          />
          <img
            src={netflixLogo}
            alt="Netflix logo"
            className="h-[120px] w-auto max-w-[200px] object-contain"
          />
          <img
            src={xboxLogo}
            alt="Xbox logo"
            className="h-[120px] w-auto max-w-[200px] object-contain"
          />
          <img
            src={cloudflareLogo}
            alt="Cloudflare logo"
            className="h-[120px] w-auto max-w-[200px] object-contain"
          />
          <img
            src={nintendoLogo}
            alt="Nintendo logo"
            className="h-[120px] w-auto max-w-[200px] object-contain"
          />
          <img
            src={deepseekLogo}
            alt="DeepSeek AI logo"
            className="h-[120px] w-auto max-w-[200px] object-contain"
          />
          <img
            src={openaiLogo}
            alt="OpenAI logo"
            className="h-[120px] w-auto max-w-[200px] object-contain"
          />
          </InfiniteSlider>
          <p className="text-xs md:text-sm text-muted-foreground mt-8 text-center">
            暂时没有合作
          </p>
      </div>
      <div className="flex justify-center mt-8">
        <Button size="lg" className="text-base px-8 py-6">
          联系我们
        </Button>
      </div>
    </div>
  );
}

