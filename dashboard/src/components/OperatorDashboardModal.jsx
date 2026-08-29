import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  TrendingUp, 
  Users, 
  CreditCard, 
  Zap, 
  Activity, 
  Check, 
  Crown, 
  RefreshCw, 
  DollarSign, 
  ArrowUpRight,
  ShieldAlert,
  Flame,
  Award,
  Sliders,
  Plus,
  Trash2,
  Edit3,
  Save,
  CheckCircle2,
  Clock,
  Settings2,
  Ban,
  Search,
  ChevronRight
} from 'lucide-react';
import { getAdminUsers, updateUserTier, updateSettings, updateExcludedMarkets, syncUpbitWarningMarkets } from '../services/api';

// 🪙 업비트 원화 마켓 전종목 메타데이터 사전 (자동완성 및 오타 방지용)
const ALL_UPBIT_COINS = [
  { code: 'KRW-BTC', symbol: 'BTC', nameKo: '비트코인', nameEn: 'Bitcoin' },
  { code: 'KRW-ETH', symbol: 'ETH', nameKo: '이더리움', nameEn: 'Ethereum' },
  { code: 'KRW-XRP', symbol: 'XRP', nameKo: '리플', nameEn: 'Ripple' },
  { code: 'KRW-SOL', symbol: 'SOL', nameKo: '솔라나', nameEn: 'Solana' },
  { code: 'KRW-DOGE', symbol: 'DOGE', nameKo: '도지코인', nameEn: 'Dogecoin' },
  { code: 'KRW-ADA', symbol: 'ADA', nameKo: '에이다', nameEn: 'Cardano' },
  { code: 'KRW-AVAX', symbol: 'AVAX', nameKo: '아발란체', nameEn: 'Avalanche' },
  { code: 'KRW-DOT', symbol: 'DOT', nameKo: '폴카닷', nameEn: 'Polkadot' },
  { code: 'KRW-NEAR', symbol: 'NEAR', nameKo: '니어프로토콜', nameEn: 'NEAR Protocol' },
  { code: 'KRW-STX', symbol: 'STX', nameKo: '스택스', nameEn: 'Stacks' },
  { code: 'KRW-SUI', symbol: 'SUI', nameKo: '수이', nameEn: 'Sui' },
  { code: 'KRW-SHIB', symbol: 'SHIB', nameKo: '시바이누', nameEn: 'Shiba Inu' },
  { code: 'KRW-PEPE', symbol: 'PEPE', nameKo: '페페', nameEn: 'Pepe' },
  { code: 'KRW-LINK', symbol: 'LINK', nameKo: '체인링크', nameEn: 'Chainlink' },
  { code: 'KRW-ETC', symbol: 'ETC', nameKo: '이더리움클래식', nameEn: 'Ethereum Classic' },
  { code: 'KRW-BCH', symbol: 'BCH', nameKo: '비트코인캐시', nameEn: 'Bitcoin Cash' },
  { code: 'KRW-SEI', symbol: 'SEI', nameKo: '세이', nameEn: 'Sei' },
  { code: 'KRW-SAND', symbol: 'SAND', nameKo: '샌드박스', nameEn: 'The Sandbox' },
  { code: 'KRW-AXS', symbol: 'AXS', nameKo: '엑시인피니티', nameEn: 'Axie Infinity' },
  { code: 'KRW-MANA', symbol: 'MANA', nameKo: '디센트럴랜드', nameEn: 'Decentraland' },
  { code: 'KRW-FLOW', symbol: 'FLOW', nameKo: '플로우', nameEn: 'Flow' },
  { code: 'KRW-EOS', symbol: 'EOS', nameKo: '이오스', nameEn: 'EOS' },
  { code: 'KRW-TRX', symbol: 'TRX', nameKo: '트론', nameEn: 'TRON' },
  { code: 'KRW-XLM', symbol: 'XLM', nameKo: '스텔라루멘', nameEn: 'Stellar Lumens' },
  { code: 'KRW-VET', symbol: 'VET', nameKo: '비체인', nameEn: 'VeChain' },
  { code: 'KRW-NEO', symbol: 'NEO', nameKo: '네오', nameEn: 'NEO' },
  { code: 'KRW-GAS', symbol: 'GAS', nameKo: '가스', nameEn: 'Gas' },
  { code: 'KRW-QTUM', symbol: 'QTUM', nameKo: '퀀텀', nameEn: 'Qtum' },
  { code: 'KRW-HBAR', symbol: 'HBAR', nameKo: '헤데라', nameEn: 'Hedera' },
  { code: 'KRW-ALGO', symbol: 'ALGO', nameKo: '알고랜드', nameEn: 'Algorand' },
  { code: 'KRW-ICP', symbol: 'ICP', nameKo: '인터넷컴퓨터', nameEn: 'Internet Computer' },
  { code: 'KRW-APT', symbol: 'APT', nameKo: '앱토스', nameEn: 'Aptos' },
  { code: 'KRW-POL', symbol: 'POL', nameKo: '폴리곤', nameEn: 'Polygon' },
  { code: 'KRW-WAVES', symbol: 'WAVES', nameKo: '웨이브', nameEn: 'Waves' },
  { code: 'KRW-KNC', symbol: 'KNC', nameKo: '카이버네트워크', nameEn: 'Kyber Network' },
  { code: 'KRW-ZRX', symbol: 'ZRX', nameKo: '제로엑스', nameEn: '0x' },
  { code: 'KRW-CHZ', symbol: 'CHZ', nameKo: '칠리즈', nameEn: 'Chiliz' },
  { code: 'KRW-ENJ', symbol: 'ENJ', nameKo: '엔진코인', nameEn: 'Enjin Coin' },
  { code: 'KRW-BAT', symbol: 'BAT', nameKo: '베이직어텐션토큰', nameEn: 'Basic Attention Token' },
  { code: 'KRW-STORJ', symbol: 'STORJ', nameKo: '스토리지', nameEn: 'Storj' },
  { code: 'KRW-SC', symbol: 'SC', nameKo: '시아코인', nameEn: 'Siacoin' },
  { code: 'KRW-ANKR', symbol: 'ANKR', nameKo: '앵커', nameEn: 'Ankr' },
  { code: 'KRW-GLM', symbol: 'GLM', nameKo: '골렘', nameEn: 'Golem' },
  { code: 'KRW-WAXP', symbol: 'WAXP', nameKo: '왁스', nameEn: 'WAX' },
  { code: 'KRW-POWR', symbol: 'POWR', nameKo: '파워렛저', nameEn: 'Power Ledger' },
  { code: 'KRW-STRAX', symbol: 'STRAX', nameKo: '스트라티스', nameEn: 'Stratis' },
  { code: 'KRW-MOC', symbol: 'MOC', nameKo: '모스코인', nameEn: 'Moss Coin' },
  { code: 'KRW-TT', symbol: 'TT', nameKo: '썬더코어', nameEn: 'ThunderCore' },
  { code: 'KRW-IQ', symbol: 'IQ', nameKo: '아이큐', nameEn: 'IQ' },
  { code: 'KRW-CRE', symbol: 'CRE', nameKo: '캐리프로토콜', nameEn: 'Carry Protocol' },
  { code: 'KRW-MED', symbol: 'MED', nameKo: '메디블록', nameEn: 'MediBloc' },
  { code: 'KRW-DKA', symbol: 'DKA', nameKo: '디카르고', nameEn: 'dKargo' },
  { code: 'KRW-AHT', symbol: 'AHT', nameKo: '아하토큰', nameEn: 'AhaToken' },
  { code: 'KRW-META', symbol: 'META', nameKo: '메타디움', nameEn: 'Metadium' },
  { code: 'KRW-FCT2', symbol: 'FCT2', nameKo: '피르마체인', nameEn: 'FirmaChain' },
  { code: 'KRW-CBK', symbol: 'CBK', nameKo: '코박토큰', nameEn: 'Cobak Token' },
  { code: 'KRW-HUM', symbol: 'HUM', nameKo: '휴먼스케이프', nameEn: 'Humanscape' },
  { code: 'KRW-DVI', symbol: 'DVI', nameKo: '디비전', nameEn: 'Dvision Network' },
  { code: 'KRW-MILK', symbol: 'MILK', nameKo: '밀크', nameEn: 'MiL.k' },
  { code: 'KRW-AERGO', symbol: 'AERGO', nameKo: '아르고', nameEn: 'Aergo' },
  { code: 'KRW-BORA', symbol: 'BORA', nameKo: '보라', nameEn: 'BORA' },
  { code: 'KRW-AQT', symbol: 'AQT', nameKo: '알파쿼크', nameEn: 'Alpha Quark' },
  { code: 'KRW-MVL', symbol: 'MVL', nameKo: '엠블', nameEn: 'MVL' },
  { code: 'KRW-TON', symbol: 'TON', nameKo: '토카막네트워크', nameEn: 'Tokamak Network' },
  { code: 'KRW-STPT', symbol: 'STPT', nameKo: '에스티피', nameEn: 'STP' },
  { code: 'KRW-CRO', symbol: 'CRO', nameKo: '크로노스', nameEn: 'Cronos' },
  { code: 'KRW-T', symbol: 'T', nameKo: '쓰레스홀드', nameEn: 'Threshold' },
  { code: 'KRW-PUNDIX', symbol: 'PUNDIX', nameKo: '펀디엑스', nameEn: 'Pundi X' },
  { code: 'KRW-CELO', symbol: 'CELO', nameKo: '셀로', nameEn: 'Celo' },
  { code: 'KRW-ELF', symbol: 'ELF', nameKo: '엘프', nameEn: 'aelf' },
  { code: 'KRW-CVC', symbol: 'CVC', nameKo: '시빅', nameEn: 'Civic' },
  { code: 'KRW-ARDR', symbol: 'ARDR', nameKo: '아더', nameEn: 'Ardor' },
  { code: 'KRW-HIVE', symbol: 'HIVE', nameKo: '하이브', nameEn: 'Hive' },
  { code: 'KRW-KAVA', symbol: 'KAVA', nameKo: '카바', nameEn: 'Kava' },
  { code: 'KRW-STMX', symbol: 'STMX', nameKo: '스톰엑스', nameEn: 'StormX' },
  { code: 'KRW-HUNT', symbol: 'HUNT', nameKo: '헌트', nameEn: 'HUNT' },
  { code: 'KRW-ATOM', symbol: 'ATOM', nameKo: '코스모스', nameEn: 'Cosmos' },
  { code: 'KRW-XTZ', symbol: 'XTZ', nameKo: '테조스', nameEn: 'Tezos' },
  { code: 'KRW-ZIL', symbol: 'ZIL', nameKo: '질리카', nameEn: 'Zilliqa' },
  { code: 'KRW-IOST', symbol: 'IOST', nameKo: '아이오에스티', nameEn: 'IOST' },
  { code: 'KRW-ICX', symbol: 'ICX', nameKo: '아이콘', nameEn: 'ICON' },
  { code: 'KRW-THETA', symbol: 'THETA', nameKo: '쎄타토큰', nameEn: 'Theta Token' },
  { code: 'KRW-TFUEL', symbol: 'TFUEL', nameKo: '쎄타퓨엘', nameEn: 'Theta Fuel' },
  { code: 'KRW-MTL', symbol: 'MTL', nameKo: '메탈', nameEn: 'Metal DAO' },
  { code: 'KRW-UPP', symbol: 'UPP', nameKo: '센티넬프로토콜', nameEn: 'Sentinel Protocol' },
  { code: 'KRW-BLUR', symbol: 'BLUR', nameKo: '블러', nameEn: 'Blur' },
  { code: 'KRW-BIGTIME', symbol: 'BIGTIME', nameKo: '빅타임', nameEn: 'Big Time' },
  { code: 'KRW-ID', symbol: 'ID', nameKo: '스페이스아이디', nameEn: 'SPACE ID' },
  { code: 'KRW-CYBER', symbol: 'CYBER', nameKo: '사이버', nameEn: 'Cyber' },
  { code: 'KRW-ARKM', symbol: 'ARKM', nameKo: '아크엠', nameEn: 'Arkham' },
  { code: 'KRW-PENDLE', symbol: 'PENDLE', nameKo: '펜들', nameEn: 'Pendle' },
  { code: 'KRW-ONDO', symbol: 'ONDO', nameKo: '온도파이낸스', nameEn: 'Ondo' },
  { code: 'KRW-G', symbol: 'G', nameKo: '그래비티', nameEn: 'Gravity' },
  { code: 'KRW-UXLINK', symbol: 'UXLINK', nameKo: '유엑스링크', nameEn: 'UXLINK' },
  { code: 'KRW-CARV', symbol: 'CARV', nameKo: '카브', nameEn: 'CARV' },
  { code: 'KRW-SAFE', symbol: 'SAFE', nameKo: '세이프', nameEn: 'Safe' },
  { code: 'KRW-MOVE', symbol: 'MOVE', nameKo: '무브', nameEn: 'Movement' },
  { code: 'KRW-KAIA', symbol: 'KAIA', nameKo: '카이아', nameEn: 'Kaia' },
  { code: 'KRW-TIA', symbol: 'TIA', nameKo: '셀레스티아', nameEn: 'Celestia' },
  { code: 'KRW-W', symbol: 'W', nameKo: '웜홀', nameEn: 'Wormhole' },
  { code: 'KRW-JUP', symbol: 'JUP', nameKo: '주피터', nameEn: 'Jupiter' },
  { code: 'KRW-DRIFT', symbol: 'DRIFT', nameKo: '드리프트', nameEn: 'Drift' },
  { code: 'KRW-ZRO', symbol: 'ZRO', nameKo: '레이어제로', nameEn: 'LayerZero' },
  { code: 'KRW-BLAST', symbol: 'BLAST', nameKo: '블라스트', nameEn: 'Blast' },
  { code: 'KRW-TAO', symbol: 'TAO', nameKo: '비텐서', nameEn: 'Bittensor' },
  { code: 'KRW-AAVE', symbol: 'AAVE', nameKo: '에이브', nameEn: 'Aave' },
  { code: 'KRW-UNI', symbol: 'UNI', nameKo: '유니스왑', nameEn: 'Uniswap' },
  { code: 'KRW-CRV', symbol: 'CRV', nameKo: '커브', nameEn: 'Curve DAO Token' },
  { code: 'KRW-MINA', symbol: 'MINA', nameKo: '미나', nameEn: 'Mina' },
  { code: 'KRW-ASTR', symbol: 'ASTR', nameKo: '아스타', nameEn: 'Astar' },
  { code: 'KRW-HIFI', symbol: 'HIFI', nameKo: '하이파이', nameEn: 'Hifi Finance' },
  { code: 'KRW-GMT', symbol: 'GMT', nameKo: '스테픈', nameEn: 'STEPN' }
];

export default function OperatorDashboardModal({ 
  isOpen, 
  onClose,
  currentSettings = {},
  onSaveSettings
}) {
  const [activeTab, setActiveTab] = useState('STRATEGY'); // 'STRATEGY' | 'EXCLUDED' | 'BUSINESS'
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  // 🚫 제외 코인 목록 관리
  const [excludedMarkets, setExcludedMarkets] = useState(currentSettings?.EXCLUDED_MARKETS || []);
  const [newExcludedInput, setNewExcludedInput] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSyncingWarnings, setIsSyncingWarnings] = useState(false);
  const [upbitWarningCoins, setUpbitWarningCoins] = useState([]);
  const dropdownRef = useRef(null);

  // 👑 운영자 단일 추천 전략 (1개의 마스터 추천전략)
  const [recommendedStrategy, setRecommendedStrategy] = useState({
    name: '🎯 마스터 황금 추천 전략 (Official Golden Standard)',
    description: '5초 단기 급등 시 신속 진입하여 +3% 익절 추적 및 -2% 칼손절 방어',
    SURGE_CHECK_SECONDS: currentSettings?.SURGE_CHECK_SECONDS || 5,
    SURGE_RATE_THRESHOLD: currentSettings?.SURGE_RATE_THRESHOLD || 1.5,
    SURGE_MIN_VOLUME_KRW: currentSettings?.SURGE_MIN_VOLUME_KRW || 10000000,
    TRAILING_TARGET_PROFIT_PCT: currentSettings?.TRAILING_TARGET_PROFIT_PCT || 3.0,
    TRAILING_CALLBACK_PCT: currentSettings?.TRAILING_CALLBACK_PCT || 1.0,
    STOP_LOSS_PCT: currentSettings?.STOP_LOSS_PCT || 2.0,
    APPROVAL_TIMEOUT_SECONDS: currentSettings?.APPROVAL_TIMEOUT_SECONDS || 30,
    AUTO_EXECUTE_ON_TIMEOUT: currentSettings?.AUTO_EXECUTE_ON_TIMEOUT !== undefined ? currentSettings.AUTO_EXECUTE_ON_TIMEOUT : false
  });

  const loadData = async () => {
    setIsLoading(true);
    try {
      const res = await getAdminUsers();
      if (res && res.users) {
        setUsers(res.users);
      }
    } catch (err) {
      console.error('Failed to load operator stats:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
      if (currentSettings) {
        setExcludedMarkets(currentSettings.EXCLUDED_MARKETS || []);
        setRecommendedStrategy(prev => ({
          ...prev,
          SURGE_CHECK_SECONDS: currentSettings.SURGE_CHECK_SECONDS || prev.SURGE_CHECK_SECONDS,
          SURGE_RATE_THRESHOLD: currentSettings.SURGE_RATE_THRESHOLD || prev.SURGE_RATE_THRESHOLD,
          SURGE_MIN_VOLUME_KRW: currentSettings.SURGE_MIN_VOLUME_KRW || prev.SURGE_MIN_VOLUME_KRW,
          TRAILING_TARGET_PROFIT_PCT: currentSettings.TRAILING_TARGET_PROFIT_PCT || prev.TRAILING_TARGET_PROFIT_PCT,
          TRAILING_CALLBACK_PCT: currentSettings.TRAILING_CALLBACK_PCT || prev.TRAILING_CALLBACK_PCT,
          STOP_LOSS_PCT: currentSettings.STOP_LOSS_PCT || prev.STOP_LOSS_PCT
        }));
      }
    }
  }, [isOpen, currentSettings]);

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!isOpen) return null;

  // 1. 단일 추천 전략 저장 (전체 봇 및 회원 추천 슬롯에 즉시 일괄 적용)
  const handleSaveRecommendedStrategy = async (e) => {
    e?.preventDefault();
    try {
      const newSettings = {
        DEFAULT_MARKET: 'KRW-BTC',
        DEFAULT_TRADE_AMOUNT: 50000,
        SURGE_CHECK_SECONDS: Number(recommendedStrategy.SURGE_CHECK_SECONDS),
        SURGE_RATE_THRESHOLD: Number(recommendedStrategy.SURGE_RATE_THRESHOLD),
        SURGE_MIN_VOLUME_KRW: Number(recommendedStrategy.SURGE_MIN_VOLUME_KRW),
        TRAILING_TARGET_PROFIT_PCT: Number(recommendedStrategy.TRAILING_TARGET_PROFIT_PCT),
        TRAILING_CALLBACK_PCT: Number(recommendedStrategy.TRAILING_CALLBACK_PCT),
        STOP_LOSS_PCT: Number(recommendedStrategy.STOP_LOSS_PCT),
        APPROVAL_TIMEOUT_SECONDS: Number(recommendedStrategy.APPROVAL_TIMEOUT_SECONDS),
        AUTO_EXECUTE_ON_TIMEOUT: Boolean(recommendedStrategy.AUTO_EXECUTE_ON_TIMEOUT),
        EXCLUDED_MARKETS: excludedMarkets
      };

      if (onSaveSettings) {
        await onSaveSettings(newSettings);
      } else {
        await updateSettings(newSettings);
      }

      setSaveSuccessMsg(`🎯 [마스터 추천전략] 파라미터가 전체 봇 엔진 및 모든 추천 슬롯에 성공적으로 일괄 반영되었습니다! 🚀`);
      setTimeout(() => setSaveSuccessMsg(''), 4500);
    } catch (err) {
      alert('추천전략 저장 실패: ' + err.message);
    }
  };

  // 2. 제외 코인 실시간 검색 필터링 (알파벳/심볼/한글명 모두 지원)
  const filteredCoins = newExcludedInput.trim() === ''
    ? []
    : ALL_UPBIT_COINS.filter(c => {
        const query = newExcludedInput.trim().toUpperCase();
        return (
          c.symbol.toUpperCase().includes(query) ||
          c.code.toUpperCase().includes(query) ||
          c.nameKo.includes(newExcludedInput.trim()) ||
          c.nameEn.toUpperCase().includes(query)
        );
      }).slice(0, 8); // 최대 8개 표시

  // 3. 제외 코인 추가/삭제 핸들러
  const handleAddExcludedMarket = async (marketCode) => {
    let formatted = marketCode.trim().toUpperCase();
    if (!formatted.startsWith('KRW-')) {
      formatted = `KRW-${formatted}`;
    }
    if (excludedMarkets.includes(formatted)) {
      alert('이미 감시/매매 제외 목록에 등록된 코인입니다.');
      return;
    }
    const updated = [...excludedMarkets, formatted];
    setExcludedMarkets(updated);
    setNewExcludedInput('');
    setIsDropdownOpen(false);

    try {
      await updateExcludedMarkets(updated);
      setSaveSuccessMsg(`[${formatted}] 코인이 감시 및 매매 제외 목록에 추가되었습니다! (레이더 감시 즉시 배제) 🚫`);
      setTimeout(() => setSaveSuccessMsg(''), 4000);
    } catch (err) {
      alert('제외 코인 저장 실패: ' + err.message);
    }
  };

  const handleRemoveExcludedMarket = async (marketCode) => {
    const updated = excludedMarkets.filter(m => m !== marketCode);
    setExcludedMarkets(updated);
    try {
      await updateExcludedMarkets(updated);
      setSaveSuccessMsg(`[${marketCode}] 코인의 제외 설정이 해제되었습니다 (급등 감시 정상 재개). ✅`);
      setTimeout(() => setSaveSuccessMsg(''), 4000);
    } catch (err) {
      alert('제외 코인 삭제 실패: ' + err.message);
    }
  };

  // 🚨 업비트 공식 유의/상폐위험 종목 원클릭 자동 동기화
  const handleSyncUpbitWarnings = async () => {
    setIsSyncingWarnings(true);
    try {
      const res = await syncUpbitWarningMarkets();
      if (res && res.success) {
        setUpbitWarningCoins(res.warningCoins || []);
        if (res.mergedExcludedMarkets) {
          setExcludedMarkets(res.mergedExcludedMarkets);
        }
        setSaveSuccessMsg(`🚨 업비트 공식 유의종목 ${res.warningCount}개가 감시/매매 제외 목록에 자동으로 동기화되었습니다! ✨`);
        setTimeout(() => setSaveSuccessMsg(''), 5000);
      }
    } catch (err) {
      alert('업비트 유의종목 동기화 실패: ' + err.message);
    } finally {
      setIsSyncingWarnings(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in">
      <div className="bg-slate-900 border border-indigo-500/60 rounded-2xl max-w-5xl w-full p-6 sm:p-7 shadow-2xl relative overflow-hidden max-h-[92vh] flex flex-col">
        {/* 상단 헤더 및 탭 메뉴 */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-tr from-indigo-500/20 via-purple-500/20 to-pink-500/20 border border-indigo-500/40 text-indigo-300 rounded-2xl shadow-md">
              <Crown className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-extrabold text-slate-100 tracking-tight">
                  사이트 운영자(관리자) 비즈니스 &amp; 전략 콘솔
                </h3>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                  Operator Master
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                추천전략 단일 제어 및 감시/매매 제외 코인(블랙리스트)을 총괄 관리합니다.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* 2대 메인 실무 탭 전환 버튼 */}
            <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
              <button
                onClick={() => setActiveTab('STRATEGY')}
                className={`px-3.5 py-2 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'STRATEGY'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Sliders className="w-3.5 h-3.5 text-indigo-300" />
                <span>🎯 전략 관리 (추천 1개)</span>
              </button>

              <button
                onClick={() => setActiveTab('EXCLUDED')}
                className={`px-3.5 py-2 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'EXCLUDED'
                    ? 'bg-rose-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Ban className="w-3.5 h-3.5 text-rose-300" />
                <span>🚫 제외 코인 ({excludedMarkets.length})</span>
              </button>
            </div>

            <button
              onClick={loadData}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
              title="새로고침"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 안내 메시지 */}
        {saveSuccessMsg && (
          <div className="mt-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{saveSuccessMsg}</span>
          </div>
        )}

        {/* 본문 스크롤 영역 */}
        <div className="py-5 space-y-5 overflow-y-auto pr-1 flex-1 text-xs text-slate-300">
          
          {/* ========================================================================= */}
          {/* TAB 1: 🎯 단일 추천 전략 알고리즘 매니저 (추천전략 1개 전용) */}
          {/* ========================================================================= */}
          {activeTab === 'STRATEGY' && (
            <div className="space-y-5">
              {/* 상단 브리핑 배너 */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-950/60 via-slate-900 to-slate-900 border border-indigo-500/30 flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shrink-0">
                    <Sliders className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-white text-sm flex items-center gap-2">
                      <span>👑 마스터 추천전략 통합 제어 (단일 전략 관리)</span>
                      <span className="text-[10px] px-2 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
                        실시간 전 봇 동기화
                      </span>
                    </h4>
                    <p className="text-xs text-slate-300 leading-relaxed mt-1">
                      모든 회원의 슬롯은 <strong>[운영자 추천전략 1개]</strong> 또는 <strong>[회원 직접 설정 셀프전략 1개]</strong>로 운영됩니다.<br />
                      여기서 추천전략 파라미터를 수정하시면, <strong>'추천전략'으로 설정된 모든 슬롯에 실시간으로 즉시 일괄 적용</strong>됩니다! ✨
                    </p>
                  </div>
                </div>

                <div className="hidden sm:flex flex-col items-end shrink-0">
                  <span className="text-[10px] text-slate-400">슬롯 운영 체계</span>
                  <span className="text-xs font-bold text-amber-300 mt-0.5">추천 1개 + 셀프 1개 모드</span>
                </div>
              </div>

              {/* 단일 추천전략 상세 파라미터 폼 (급등 포착 조건 단일 관리) */}
              <form onSubmit={handleSaveRecommendedStrategy} className="bg-slate-950/80 p-5 sm:p-7 rounded-2xl border-2 border-indigo-500/40 space-y-6 shadow-xl max-w-2xl mx-auto">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-amber-400" />
                    <h5 className="font-extrabold text-slate-100 text-base">
                      {recommendedStrategy.name}
                    </h5>
                  </div>
                  <span className="text-xs text-emerald-400 font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30">
                    전체 추천 슬롯 자동 연동
                  </span>
                </div>

                {/* 단일 핵심 파라미터: 급등 포착 조건 (Surge Engine) */}
                <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
                  <div className="font-bold text-amber-400 flex items-center justify-between border-b border-slate-800 pb-2.5">
                    <span className="flex items-center gap-2 text-sm">
                      <Zap className="w-4 h-4" />
                      급등 포착 조건 (Surge Engine)
                    </span>
                    <span className="text-[11px] text-slate-400 font-normal">
                      조건 만족 시 봇이 즉시 자동 포착
                    </span>
                  </div>

                  <div>
                    <label className="text-slate-200 block mb-1.5 text-xs font-bold">감시 시간 (초)</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        max="300"
                        value={recommendedStrategy.SURGE_CHECK_SECONDS}
                        onChange={(e) => setRecommendedStrategy({ ...recommendedStrategy, SURGE_CHECK_SECONDS: Number(e.target.value) })}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-100 font-mono text-sm font-bold focus:outline-none focus:border-amber-400"
                      />
                      <span className="text-slate-300 text-xs font-bold shrink-0">초간</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">예: 최근 60초 또는 5초 동안의 틱 시세를 롤링 분석</p>
                  </div>

                  <div>
                    <label className="text-slate-200 block mb-1.5 text-xs font-bold">상승률 기준 (%)</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        step="0.1"
                        min="0.1"
                        value={recommendedStrategy.SURGE_RATE_THRESHOLD}
                        onChange={(e) => setRecommendedStrategy({ ...recommendedStrategy, SURGE_RATE_THRESHOLD: Number(e.target.value) })}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-rose-300 font-mono text-sm font-bold focus:outline-none focus:border-rose-400"
                      />
                      <span className="text-slate-300 text-xs font-bold shrink-0">% 이상</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">지정 시간 내 최저가 대비 순간 상승폭</p>
                  </div>

                  <div>
                    <label className="text-slate-200 block mb-1.5 text-xs font-bold">최소 거래대금 필터 (원)</label>
                    <input
                      type="number"
                      step="1000000"
                      value={recommendedStrategy.SURGE_MIN_VOLUME_KRW}
                      onChange={(e) => setRecommendedStrategy({ ...recommendedStrategy, SURGE_MIN_VOLUME_KRW: Number(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-emerald-300 font-mono text-sm font-bold focus:outline-none focus:border-emerald-400"
                    />
                    <p className="text-xs text-slate-400 mt-1.5 font-mono font-bold">
                      {Math.round(Number(recommendedStrategy.SURGE_MIN_VOLUME_KRW || 0)).toLocaleString()}원 ({(Number(recommendedStrategy.SURGE_MIN_VOLUME_KRW || 0) / 10000).toLocaleString()}만원) 이상 수급 시 유효
                    </p>
                  </div>
                </div>

                {/* 하단 저장 버튼 */}
                <div className="flex items-center justify-end pt-2">
                  <button
                    type="submit"
                    className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-sm transition flex items-center justify-center gap-2 shadow-xl shadow-indigo-600/40 cursor-pointer"
                  >
                    <Save className="w-5 h-5" />
                    <span>💾 마스터 추천전략 저장 및 전체 봇 일괄 적용하기</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: 🚫 감시/매매 제외 코인 관리 (Blacklist + 실시간 검색 자동완성 + 업비트 유의종목 자동 동기화) */}
          {/* ========================================================================= */}
          {activeTab === 'EXCLUDED' && (
            <div className="space-y-6">
              {/* 상단 설명 배너 & 업비트 유의종목 자동 동기화 버튼 */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-950/50 via-slate-900 to-slate-900 border border-rose-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-300 shrink-0">
                    <Ban className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-white text-sm flex items-center gap-2">
                      <span>전종목 자동 감시 중 특정 코인 제외 (Blacklist)</span>
                      <span className="text-[10px] px-2 py-0.2 rounded-full bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30">
                        레이더 100% 차단
                      </span>
                    </h4>
                    <p className="text-xs text-slate-300 leading-relaxed mt-1">
                      업비트 원화마켓 전종목 실시간 감시 중, <strong>유의종목(상폐위험)이나 급변동/특정 코인</strong>을 등록하면 
                      <strong>급등 레이더 포착 및 자동 매수 대상에서 즉시 제외</strong>됩니다.
                    </p>
                  </div>
                </div>

                {/* 🚨 업비트 유의종목 원클릭 자동 동기화 스마트 버튼 */}
                <button
                  type="button"
                  onClick={handleSyncUpbitWarnings}
                  disabled={isSyncingWarnings}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-slate-950 font-black text-xs transition flex items-center justify-center gap-1.5 shadow-lg shadow-rose-900/30 shrink-0 cursor-pointer disabled:opacity-50"
                  title="업비트 공식 OpenAPI를 실시간 조회하여 현재 유의종목/투자경고 종목을 자동으로 제외 목록에 추가합니다."
                >
                  <ShieldAlert className={`w-4 h-4 ${isSyncingWarnings ? 'animate-spin' : ''}`} />
                  <span>{isSyncingWarnings ? '유의종목 조회 중...' : '🚨 업비트 유의(상폐위험) 코인 자동 동기화'}</span>
                </button>
              </div>

              {/* 코인 등록 입력창 (실시간 알파벳/한글 자동완성 드롭다운 탑재) */}
              <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-4" ref={dropdownRef}>
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-extrabold text-slate-200 flex items-center gap-1.5">
                    <Plus className="w-4 h-4 text-emerald-400" />
                    <span>제외할 코인 티커(심볼) 또는 한글명 검색 추가</span>
                  </h4>
                  <span className="text-[11px] text-slate-400">
                    💡 알파벳(XRP, BTC 등)이나 한글(리플, 도지 등)을 입력하면 목록이 나타납니다.
                  </span>
                </div>

                <div className="relative">
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Search className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        placeholder="코인 티커(XRP, DOGE, SOL...) 또는 한글명(리플, 도지...)을 입력하세요"
                        value={newExcludedInput}
                        onChange={(e) => {
                          setNewExcludedInput(e.target.value);
                          setIsDropdownOpen(true);
                        }}
                        onFocus={() => {
                          if (newExcludedInput.trim()) setIsDropdownOpen(true);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (filteredCoins.length > 0) {
                              handleAddExcludedMarket(filteredCoins[0].code);
                            } else if (newExcludedInput.trim()) {
                              handleAddExcludedMarket(newExcludedInput);
                            }
                          }
                        }}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-white font-mono text-sm uppercase focus:outline-none focus:border-rose-400"
                      />
                      {newExcludedInput && (
                        <button
                          type="button"
                          onClick={() => {
                            setNewExcludedInput('');
                            setIsDropdownOpen(false);
                          }}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (filteredCoins.length > 0) {
                          handleAddExcludedMarket(filteredCoins[0].code);
                        } else if (newExcludedInput.trim()) {
                          handleAddExcludedMarket(newExcludedInput);
                        }
                      }}
                      className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs transition shadow-md cursor-pointer shrink-0 flex items-center gap-1.5"
                    >
                      <Plus className="w-4 h-4" />
                      <span>제외 등록</span>
                    </button>
                  </div>

                  {/* 🔍 실시간 코인 검색 추천 드롭다운 목록 (오타 방지) */}
                  {isDropdownOpen && filteredCoins.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1.5 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-30 overflow-hidden divide-y divide-slate-800 animate-in fade-in">
                      <div className="px-3 py-1.5 bg-slate-950/80 text-[10px] font-bold text-slate-400 flex justify-between">
                        <span>업비트 원화 마켓 일치 코인 목록 ({filteredCoins.length}건)</span>
                        <span>클릭 시 바로 제외 등록</span>
                      </div>
                      {filteredCoins.map((coin) => {
                        const isAlreadyExcluded = excludedMarkets.includes(coin.code);
                        return (
                          <div
                            key={coin.code}
                            onClick={() => {
                              if (!isAlreadyExcluded) {
                                handleAddExcludedMarket(coin.code);
                              }
                            }}
                            className={`px-4 py-2.5 flex items-center justify-between cursor-pointer transition ${
                              isAlreadyExcluded
                                ? 'bg-slate-950/40 text-slate-500 cursor-not-allowed'
                                : 'hover:bg-indigo-600/20 hover:border-l-4 hover:border-l-rose-500'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <span className="font-mono font-black text-rose-300 text-sm">
                                {coin.code}
                              </span>
                              <span className="text-white font-bold text-xs">
                                {coin.nameKo}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                ({coin.nameEn})
                              </span>
                            </div>

                            {isAlreadyExcluded ? (
                              <span className="text-[10px] px-2 py-0.5 rounded bg-rose-950/60 text-rose-400 border border-rose-500/30 font-bold">
                                이미 제외 중
                              </span>
                            ) : (
                              <div className="flex items-center gap-1 text-[11px] text-rose-400 font-bold">
                                <span>+ 제외 추가</span>
                                <ChevronRight className="w-3.5 h-3.5" />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* 추천 퀵 제외 버튼 */}
                <div className="flex items-center gap-1.5 flex-wrap pt-1 text-xs">
                  <span className="text-[11px] text-slate-500 font-bold">빠른 추가:</span>
                  {['KRW-XRP', 'KRW-DOGE', 'KRW-SHIB', 'KRW-BTT', 'KRW-TRX', 'KRW-PEPE', 'KRW-STRAX', 'KRW-TT'].map((coin) => (
                    <button
                      key={coin}
                      type="button"
                      disabled={excludedMarkets.includes(coin)}
                      onClick={() => handleAddExcludedMarket(coin)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold border transition ${
                        excludedMarkets.includes(coin)
                          ? 'bg-slate-800 text-slate-600 border-slate-800 cursor-not-allowed'
                          : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700 cursor-pointer'
                      }`}
                    >
                      +{coin}
                    </button>
                  ))}
                </div>
              </div>

              {/* 현재 제외된 코인 목록 */}
              <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h4 className="font-bold text-white text-sm flex items-center gap-2">
                    <span>현재 감시/매매 제외 중인 코인 목록 (Blacklist)</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold font-mono">
                      총 {excludedMarkets.length}종목
                    </span>
                  </h4>
                  <span className="text-[11px] text-slate-400">
                    * 등록된 종목은 급등 레이더 신호 포착 및 자동 매수가 발생하지 않습니다.
                  </span>
                </div>

                {excludedMarkets.length === 0 ? (
                  <div className="py-8 text-center text-slate-500 text-xs">
                    현재 제외된 코인이 없습니다. 업비트 원화마켓 모든 코인이 정상 감시 중입니다. ✨
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {excludedMarkets.map((market) => {
                      const isWarning = upbitWarningCoins.some(w => w.market === market) || ['KRW-BONK', 'KRW-RVN', 'KRW-MANTRA', 'KRW-SAND', 'KRW-TT', 'KRW-STORJ', 'KRW-ZIL', 'KRW-ICX'].includes(market);
                      return (
                        <div
                          key={market}
                          className={`px-3.5 py-2 rounded-xl border text-xs font-black flex items-center gap-2 shadow-sm ${
                            isWarning 
                              ? 'bg-amber-950/40 border-amber-500/50 text-amber-200 ring-1 ring-amber-500/20' 
                              : 'bg-rose-950/40 border border-rose-500/40 text-rose-200 font-mono'
                          }`}
                        >
                          {isWarning ? (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30 whitespace-nowrap">
                              🚨 업비트 유의
                            </span>
                          ) : (
                            <Ban className="w-3.5 h-3.5 text-rose-400" />
                          )}
                          <span className="font-mono">{market}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveExcludedMarket(market)}
                            className="p-1 rounded-lg hover:bg-rose-900/60 text-rose-400 hover:text-white transition cursor-pointer"
                            title="제외 해제 (감시 정상 재개)"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

