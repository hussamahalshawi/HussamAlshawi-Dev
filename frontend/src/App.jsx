/*
 * App.jsx - القلب النابض للمشروع
 * يقوم بإدارة حالة التحميل وجلب البيانات من الـ API
 */
import { useState, useEffect } from 'react';
import PageLoader from './components/utils/PageLoader';
import OfflineBanner from './components/utils/OfflineBanner';
import { API_BASE_URL, ENDPOINTS } from './utils/constants';

// ملاحظة: سنحتاج لاستيراد الأقسام (Hero, Navbar...) فور رفعها
// import Navbar from './components/layout/Navbar'; 

function App() {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // دالة جلب البيانات من السيرفر
    const fetchPortfolioData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`${API_BASE_URL}${ENDPOINTS.PROFILE}`);
        if (!response.ok) throw new Error('Failed to fetch data');
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError("Unable to connect to the portfolio API. Some data might be missing.");
        console.error("API Error:", err);
      } finally {
        // تأخير بسيط لإعطاء تجربة مستخدم سلسة مع الـ Loader
        setTimeout(() => setIsLoading(false), 1200);
      }
    };

    fetchPortfolioData();
  }, []);

  return (
    <div className="app-container">
      {/* شاشة التحميل الرئيسية */}
      <PageLoader visible={isLoading} />

      {/* بانر حالة عدم الاتصال */}
      {error && <OfflineBanner message={error} />}

      {!isLoading && (
        <main className="fade-in">
          {/* هنا سيتم وضع الأقسام فور جاهزيتها */}
          {/* <Navbar /> */}
          <section style={{ padding: '100px 20px', textAlign: 'center' }}>
            <h1 className="s-title">Hussam Alshawi</h1>
            <p className="s-sub">Portfolio structure is ready. Waiting for sections...</p>
          </section>
        </main>
      )}
    </div>
  );
}

export default App;