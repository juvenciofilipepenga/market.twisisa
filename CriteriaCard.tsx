import React from "react";
import { CheckCircleIcon } from "@/components/icons";

export interface CriteriaItem {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  badge?: string;
  completed?: boolean;
}

interface CriteriaCardProps {
  item: CriteriaItem;
  isHighlighted?: boolean;
}

export function CriteriaCard({ item, isHighlighted = false }: CriteriaCardProps) {
  return (
    <div
      className={`
        group relative overflow-hidden rounded-2xl
        border-2 p-6 transition-all duration-300 ease-in-out
        hover:shadow-lg hover:scale-105
        ${
          isHighlighted
            ? "border-primary bg-gradient-to-br from-primary/10 to-primary/5 shadow-lg"
            : "border-border bg-white hover:border-primary/50"
        }
      `}
    >
      {/* Background decoration */}
      <div
        className={`
          absolute -top-8 -right-8 w-32 h-32 rounded-full
          transition-all duration-300 ease-in-out
          ${isHighlighted ? "bg-primary/20 scale-100" : "bg-primary/5 scale-75"}
        `}
      />

      {/* Conteúdo */}
      <div className="relative z-10">
        {/* Header com ícone e badge */}
        <div className="flex items-start justify-between mb-3">
          <div
            className={`
              flex-shrink-0 w-12 h-12 rounded-lg
              flex items-center justify-center
              transition-all duration-300
              ${
                isHighlighted
                  ? "bg-primary/20 text-primary scale-110"
                  : "bg-gray-100 text-gray-600 group-hover:bg-primary/10 group-hover:text-primary"
              }
            `}
          >
            {item.icon}
          </div>

          {item.completed && (
            <div className="flex-shrink-0 text-green-600">
              <CheckCircleIcon width={24} height={24} />
            </div>
          )}
        </div>

        {/* Título */}
        <h3
          className={`
            text-lg font-bold mb-2
            transition-colors duration-300
            ${isHighlighted ? "text-primary" : "text-ink"}
          `}
        >
          {item.title}
        </h3>

        {/* Descrição */}
        <p className="text-sm text-ink-muted leading-relaxed mb-3">
          {item.description}
        </p>

        {/* Badge */}
        {item.badge && (
          <div className="inline-flex items-center">
            <span
              className={`
                inline-block px-3 py-1 rounded-full text-xs font-semibold
                transition-all duration-300
                ${
                  isHighlighted
                    ? "bg-primary/20 text-primary"
                    : "bg-gray-100 text-gray-600 group-hover:bg-primary/10 group-hover:text-primary"
                }
              `}
            >
              {item.badge}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
