describe("Pruebas de Lista de Tareas (CRUD)", () => {
  // Derivamos la PDA que se usará en todos los tests
  const [listaPDA] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("lista_tareas"), pg.wallet.publicKey.toBuffer()],
    pg.program.programId
  );

  it("1. Inicializa la lista de tareas", async () => {
    // Verificamos si la cuenta ya existe para evitar errores en múltiples ejecuciones de prueba
    const cuentaExistente = await pg.connection.getAccountInfo(listaPDA);
    
    if (!cuentaExistente) {
      await pg.program.methods
        .crearLista("Mi Lista de Certificación")
        .accounts({
          owner: pg.wallet.publicKey,
          lista: listaPDA,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();
    }
    
    const lista = await pg.program.account.listaTareas.fetch(listaPDA);
    assert(lista.nombre === "Mi Lista de Certificación" || cuentaExistente, "El nombre de la lista no coincide");
  });

  it("2. Agrega una tarea nueva", async () => {
    await pg.program.methods
      .agregarTarea("Aprender Anchor", 1)
      .accounts({
        owner: pg.wallet.publicKey,
        lista: listaPDA,
      })
      .rpc();

    const lista = await pg.program.account.listaTareas.fetch(listaPDA);
    const tarea = lista.tareas.find(t => t.descripcion === "Aprender Anchor");
    
    assert(tarea !== undefined, "La tarea no se agregó correctamente");
    assert(tarea.prioridad === 1, "La prioridad es incorrecta");
    assert(tarea.completada === false, "La tarea debería estar pendiente");
  });

  it("3. Actualiza el estado de una tarea", async () => {
    await pg.program.methods
      .actualizarTarea("Aprender Anchor", 5, true) // Nueva prioridad 5, completada true
      .accounts({
        owner: pg.wallet.publicKey,
        lista: listaPDA,
      })
      .rpc();

    const lista = await pg.program.account.listaTareas.fetch(listaPDA);
    const tarea = lista.tareas.find(t => t.descripcion === "Aprender Anchor");
    
    assert(tarea.prioridad === 5, "La prioridad no se actualizó");
    assert(tarea.completada === true, "El estado completado no se actualizó");
  });

  it("4. Elimina una tarea", async () => {
    await pg.program.methods
      .eliminarTarea("Aprender Anchor")
      .accounts({
        owner: pg.wallet.publicKey,
        lista: listaPDA,
      })
      .rpc();

    const lista = await pg.program.account.listaTareas.fetch(listaPDA);
    const tarea = lista.tareas.find(t => t.descripcion === "Aprender Anchor");
    
    assert(tarea === undefined, "La tarea no fue eliminada");
  });
});
