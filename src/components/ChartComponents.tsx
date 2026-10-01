import React, { useEffect, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  BarController,
  ChartData,
} from 'chart.js';
import { bandColorsHex, bandLabels, bandForMark, isAbsent, isNumericMark } from '../utils/stats';
import { StudentItem, SubjectItem, SubjectStat } from '../types';

// Register Chart.js modules
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  BarController
);

const chartAnimationConfig = {
  duration: 600,
  easing: 'easeOutQuart' as const,
};

interface DistributionChartProps {
  distCounts: Record<number, number>;
}

export const DistributionChart: React.FC<DistributionChartProps> = ({ distCounts }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstance = useRef<ChartJS | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const order = [1, 2, 3, 4, 5];
    const data: ChartData<'bar'> = {
      labels: order.map((b) => bandLabels[b]),
      datasets: [
        {
          data: order.map((b) => distCounts[b] || 0),
          backgroundColor: order.map((b) => bandColorsHex[b]),
          borderRadius: 6,
          maxBarThickness: 64,
        },
      ],
    };

    chartInstance.current = new ChartJS(ctx, {
      type: 'bar',
      data,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: chartAnimationConfig,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (c) => `${c.raw} student(s)`,
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1,
              font: { family: "'IBM Plex Mono', monospace", size: 11 },
              color: '#5B6B78',
            },
            grid: { color: '#EAEEEA' },
          },
          x: {
            grid: { display: false },
            ticks: {
              font: { family: "'IBM Plex Sans', sans-serif", size: 12 },
              color: '#16232E',
            },
          },
        },
      },
    });

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
        chartInstance.current = null;
      }
    };
  }, [distCounts]);

  return <canvas ref={canvasRef} className="w-full h-full" />;
};

interface OverviewChartProps {
  subjStats: SubjectStat[];
}

export const OverviewChart: React.FC<OverviewChartProps> = ({ subjStats }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstance = useRef<ChartJS | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const data: ChartData<'bar'> = {
      labels: subjStats.map((s) => s.sub.name),
      datasets: [
        {
          label: 'On track (60%+)',
          data: subjStats.map((s) => s.onTrack),
          backgroundColor: '#3F7A5C',
          stack: 's',
          borderRadius: 4,
        },
        {
          label: 'Needs support',
          data: subjStats.map((s) => s.needsSupport),
          backgroundColor: '#D98A4E',
          stack: 's',
          borderRadius: 4,
        },
      ],
    };

    chartInstance.current = new ChartJS(ctx, {
      type: 'bar',
      data,
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        animation: chartAnimationConfig,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              boxWidth: 12,
              font: { size: 11, family: "'IBM Plex Sans', sans-serif" },
              color: '#5B6B78',
            },
          },
          tooltip: {
            callbacks: {
              label: (c) => `${c.dataset.label}: ${c.raw} student(s)`,
            },
          },
        },
        scales: {
          x: {
            stacked: true,
            grid: { color: '#EAEEEA' },
            ticks: {
              stepSize: 1,
              font: { family: "'IBM Plex Mono', monospace", size: 10 },
              color: '#5B6B78',
            },
          },
          y: {
            stacked: true,
            grid: { display: false },
            ticks: {
              font: { family: "'IBM Plex Sans', sans-serif", size: 12 },
              color: '#16232E',
            },
          },
        },
      },
    });

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
        chartInstance.current = null;
      }
    };
  }, [subjStats]);

  return <canvas ref={canvasRef} className="w-full h-full" />;
};

interface DetailChartProps {
  validStudents: StudentItem[];
  selectedSubject: SubjectItem;
}

export const DetailChart: React.FC<DetailChartProps> = ({ validStudents, selectedSubject }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstance = useRef<ChartJS | null>(null);

  useEffect(() => {
    if (!canvasRef.current || !selectedSubject) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    validStudents.forEach((st) => {
      const v = st.marks[selectedSubject.id];
      if (isNumericMark(v)) {
        counts[bandForMark(Number(v), selectedSubject)]++;
      } else if (isAbsent(v)) {
        counts[1]++;
      }
    });

    const order = [1, 2, 3, 4, 5];
    const data: ChartData<'bar'> = {
      labels: order.map((b) => bandLabels[b]),
      datasets: [
        {
          data: order.map((b) => counts[b] || 0),
          backgroundColor: order.map((b) => bandColorsHex[b]),
          borderRadius: 6,
          maxBarThickness: 40,
        },
      ],
    };

    chartInstance.current = new ChartJS(ctx, {
      type: 'bar',
      data,
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        animation: chartAnimationConfig,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (c) => `${c.raw} student(s)`,
            },
          },
        },
        scales: {
          x: {
            beginAtZero: true,
            grid: { color: '#EAEEEA' },
            ticks: {
              stepSize: 1,
              font: { family: "'IBM Plex Mono', monospace", size: 10 },
              color: '#5B6B78',
            },
          },
          y: {
            grid: { display: false },
            ticks: {
              font: { family: "'IBM Plex Sans', sans-serif", size: 11.5 },
              color: '#16232E',
            },
          },
        },
      },
    });

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
        chartInstance.current = null;
      }
    };
  }, [validStudents, selectedSubject]);

  return <canvas ref={canvasRef} className="w-full h-full" />;
};
