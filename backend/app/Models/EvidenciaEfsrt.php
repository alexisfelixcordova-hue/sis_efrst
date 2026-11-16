<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EvidenciaEfsrt extends Model
{
    use HasFactory;

    protected $table = 'evidencias_efsrt';
    protected $primaryKey = 'id_evidencia';
    
    // Desactivamos updated_at ya que tu tabla solo tiene created_at
    public $timestamps = false; 

    protected $fillable = [
        'id_expediente',
        'tipo_evidencia',
        'titulo_evidencia',
        'ruta_archivo_o_url',
        'created_at'
    ];

    public function expediente()
    {
        return $this->belongsTo(ExpedienteEfsrt::class, 'id_expediente', 'id_expediente');
    }
}