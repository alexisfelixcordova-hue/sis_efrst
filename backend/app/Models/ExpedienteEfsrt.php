<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ExpedienteEfsrt extends Model
{
    use HasFactory;

    protected $table = 'expediente_efsrt';
    protected $primaryKey = 'id_expediente';

    protected $fillable = [
        'id_estudiante',
        'id_modulo',
        'id_empresa',
        'id_docente_asesor',
        'horas_acumuladas',
        'estado_efsrt',
        'portafolio_fisico_revisado',
        'observaciones',
        'fecha_validacion'
    ];

    // Relaciones
    public function estudiante()
    {
        return $this->belongsTo(Estudiante::class, 'id_estudiante', 'id_estudiante');
    }

    public function modulo()
    {
        return $this->belongsTo(ModuloProfesional::class, 'id_modulo', 'id_modulo');
    }

    public function empresa()
    {
        return $this->belongsTo(EmpresaConvenio::class, 'id_empresa', 'id_empresa');
    }

    public function evidencias()
    {
        return $this->hasMany(EvidenciaEfsrt::class, 'id_expediente', 'id_expediente');
    }
}