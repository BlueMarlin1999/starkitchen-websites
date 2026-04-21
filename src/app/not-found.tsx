import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(126,167,255,0.20),_transparent_34%),linear-gradient(180deg,_#04102a_0%,_#0b2450_52%,_#123a74_100%)]">
      <div className="text-center px-6">
        <h1 className="text-8xl font-bold text-white/10">404</h1>
        <h2 className="text-2xl font-semibold text-white mt-4">页面未找到</h2>
        <p className="text-slate-400 mt-2">您访问的页面不存在或已移动</p>
        <div className="flex gap-4 justify-center mt-8">
          <Link
            href="/"
            className="px-6 py-3 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            返回首页
          </Link>
          <Link
            href="/dashboard/"
            className="px-6 py-3 rounded-xl border border-white/10 text-slate-300 text-sm font-medium hover:border-white/25 transition-colors"
          >
            进入驾驶舱
          </Link>
        </div>
      </div>
    </main>
  );
}
