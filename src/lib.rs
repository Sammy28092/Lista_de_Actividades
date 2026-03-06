use anchor_lang::prelude::*;

// Recuerda que este ID se actualiza solo en SolPG al hacer "Build"
declare_id!("Amdp8Vzn8aQRt6aGqWFtokBK5Lw9EViGdHaLTFTC4VXE");

#[program]
pub mod lista_tareas {
    use super::*;

    // 1. CREATE: Crear lista
    pub fn crear_lista(ctx: Context<NuevaLista>, nombre_lista: String) -> Result<()> {
        let owner = ctx.accounts.owner.key();
        let tareas: Vec<Tarea> = Vec::new();

        ctx.accounts.lista.set_inner(ListaTareas {
            owner,
            nombre: nombre_lista.clone(), 
            tareas,
        });

        msg!("¡Lista de tareas '{}' creada con éxito!", nombre_lista);
        Ok(())
    }

    // 2. CREATE: Agregar tarea con validación de límite
    pub fn agregar_tarea(ctx: Context<GestionTareas>, descripcion: String, prioridad: u8) -> Result<()> {
        // MEJORA: Validamos que no se exceda el límite de 15 tareas definido en el espacio
        require!(ctx.accounts.lista.tareas.len() < 15, Errores::ListaLlena);

        let tarea = Tarea {
            descripcion: descripcion.clone(), 
            prioridad,
            completada: false,
        };

        ctx.accounts.lista.tareas.push(tarea);
        msg!("Tarea agregada: {}", descripcion);
        Ok(())
    }

    // 3. READ: Ver tareas en logs
    pub fn ver_tareas(ctx: Context<GestionTareas>) -> Result<()> {
        msg!("Lista: {}", ctx.accounts.lista.nombre);
        for tarea in &ctx.accounts.lista.tareas {
            let estado = if tarea.completada { "Completada" } else { "Pendiente" };
            msg!("Tarea: {} | Prioridad: {} | Estado: {}", tarea.descripcion, tarea.prioridad, estado);
        }
        Ok(())
    }

    // 4. UPDATE: Marcar tarea como completada o cambiar prioridad
    pub fn actualizar_tarea(ctx: Context<GestionTareas>, descripcion: String, nueva_prioridad: u8, completada: bool) -> Result<()> {
        let tareas = &mut ctx.accounts.lista.tareas;
        
        for t in tareas.iter_mut() {
            if t.descripcion == descripcion {
                t.prioridad = nueva_prioridad;
                t.completada = completada;
                msg!("Tarea '{}' actualizada.", descripcion);
                return Ok(());
            }
        }
        Err(Errores::TareaNoEncontrada.into())
    }

    // 5. DELETE: Eliminar una tarea
    pub fn eliminar_tarea(ctx: Context<GestionTareas>, descripcion: String) -> Result<()> {
        let tareas = &mut ctx.accounts.lista.tareas;
        let index = tareas.iter().position(|t| t.descripcion == descripcion);

        if let Some(i) = index {
            tareas.remove(i);
            msg!("Tarea '{}' eliminada.", descripcion);
            Ok(())
        } else {
            Err(Errores::TareaNoEncontrada.into())
        }
    }
}

#[error_code]
pub enum Errores {
    #[msg("La tarea solicitada no existe en la lista.")]
    TareaNoEncontrada,
    #[msg("La lista está llena. Has alcanzado el límite de 15 tareas.")] // NUEVO ERROR
    ListaLlena,
}

#[account]
#[derive(InitSpace)]
pub struct ListaTareas {
    pub owner: Pubkey,
    #[max_len(40)]
    pub nombre: String,
    #[max_len(15)] // Capacidad fija para 15 tareas
    pub tareas: Vec<Tarea>,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, InitSpace, PartialEq, Debug)]
pub struct Tarea {
    #[max_len(50)]
    pub descripcion: String,
    pub prioridad: u8,
    pub completada: bool,
}

#[derive(Accounts)]
pub struct NuevaLista<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(
        init,
        payer = owner,
        space = ListaTareas::INIT_SPACE + 8,
        seeds = [b"lista_tareas", owner.key().as_ref()],
        bump
    )]
    pub lista: Account<'info, ListaTareas>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct GestionTareas<'info> {
    pub owner: Signer<'info>,

    #[account(
        mut,
        seeds = [b"lista_tareas", owner.key().as_ref()],
        bump,
        has_one = owner
    )]
    pub lista: Account<'info, ListaTareas>,
}
