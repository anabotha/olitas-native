interface CardHeadingProps {
    icon: React.ReactNode;
    title: string;
    subtitle?: React.ReactNode;
    /** Al lado del título (ej. un InfoTip) */
    extra?: React.ReactNode;
}

// Encabezado de card compartido: ícono en caja + título + subtítulo (estilo de las cards de actividad)
export function CardHeading({ icon, title, subtitle, extra }: CardHeadingProps) {
    return (
        <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
                {icon}
            </div>
            <div>
                <div className="flex items-center gap-1.5">
                    <h3 className="text-base font-semibold text-foreground">{title}</h3>
                    {extra}
                </div>
                {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
            </div>
        </div>
    );
}
