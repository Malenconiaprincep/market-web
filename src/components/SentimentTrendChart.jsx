import { useMemo } from 'react'
import ReactECharts from 'echarts-for-react'

const AMBER = '#f59e0b'
const HOT = '#ef4444'
const COLD = '#22c55e'
const TEXT = '#EAEAEB'
const AXIS = 'rgba(255,255,255,0.12)'

export default function SentimentTrendChart({ rows }) {
  const option = useMemo(() => {
    const dates = rows.map((r) => r.date)
    const temps = rows.map((r) => r.temperature)
    const zt = rows.map((r) => r.zt_count)
    const dt = rows.map((r) => r.dt_count)

    return {
      backgroundColor: 'transparent',
      textStyle: { color: TEXT },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'cross', crossStyle: { color: AXIS } },
        backgroundColor: 'rgba(16,16,20,0.92)',
        borderColor: 'rgba(255,255,255,0.12)',
        textStyle: { color: TEXT, fontSize: 12 },
        formatter(params) {
          if (!params?.length) return ''
          const axis = params[0]?.axisValueLabel ?? params[0]?.name ?? ''
          const lines = [axis]
          for (const p of params) {
            if (p.seriesName === '情绪温度') {
              lines.push(`${p.marker}${p.seriesName}: ${p.value}°C`)
            } else {
              lines.push(`${p.marker}${p.seriesName}: ${p.value}`)
            }
          }
          return lines.join('<br/>')
        },
      },
      legend: {
        data: ['情绪温度', '涨停', '跌停'],
        textStyle: { color: TEXT },
        top: 0,
        right: 8,
      },
      grid: {
        left: 48,
        right: 48,
        top: 40,
        bottom: 72,
      },
      xAxis: {
        type: 'category',
        data: dates,
        boundaryGap: true,
        axisLine: { lineStyle: { color: AXIS } },
        axisLabel: { color: 'rgba(234,234,235,0.75)', fontSize: 10 },
        splitLine: { show: false },
      },
      yAxis: [
        {
          type: 'value',
          name: '温度',
          min: 0,
          max: 100,
          position: 'left',
          axisLine: { show: true, lineStyle: { color: AXIS } },
          axisLabel: { color: 'rgba(234,234,235,0.75)' },
          splitLine: { lineStyle: { color: 'rgba(255,255,255,0.06)' } },
        },
        {
          type: 'value',
          name: '家数',
          min: 0,
          position: 'right',
          axisLine: { show: true, lineStyle: { color: AXIS } },
          axisLabel: { color: 'rgba(234,234,235,0.75)' },
          splitLine: { show: false },
        },
      ],
      dataZoom: [
        { type: 'inside', xAxisIndex: 0, start: 0, end: 100 },
        {
          type: 'slider',
          xAxisIndex: 0,
          start: 0,
          end: 100,
          height: 22,
          bottom: 8,
          borderColor: 'rgba(255,255,255,0.12)',
          fillerColor: 'rgba(245,158,11,0.15)',
          handleStyle: { color: AMBER },
          textStyle: { color: 'rgba(234,234,235,0.6)' },
        },
      ],
      series: [
        {
          name: '情绪温度',
          type: 'line',
          yAxisIndex: 0,
          data: temps,
          smooth: true,
          symbol: 'circle',
          symbolSize: 6,
          lineStyle: { width: 2, color: AMBER },
          itemStyle: { color: AMBER },
        },
        {
          name: '涨停',
          type: 'bar',
          yAxisIndex: 1,
          data: zt,
          barMaxWidth: 14,
          itemStyle: { color: HOT },
        },
        {
          name: '跌停',
          type: 'bar',
          yAxisIndex: 1,
          data: dt,
          barMaxWidth: 14,
          itemStyle: { color: COLD },
        },
      ],
    }
  }, [rows])

  if (!rows?.length) {
    return (
      <div className="flex h-[360px] items-center justify-center rounded-lg border border-white/10 bg-white/[0.02] text-sm text-zinc-500">
        暂无图表数据
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.02] p-2">
      <ReactECharts
        option={option}
        style={{ height: 360, width: '100%' }}
        opts={{ renderer: 'canvas' }}
        notMerge
        lazyUpdate
      />
    </div>
  )
}
