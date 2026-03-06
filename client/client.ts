async function runToDoList() {
  console.log("🚀 Iniciando Lista de Tareas CRUD completo...");

  // 1. Derivar la dirección de la PDA
  const [listaPDA] = await anchor.web3.PublicKey.findProgramAddress(
    [Buffer.from("lista_tareas"), pg.wallet.publicKey.toBuffer()],
    pg.program.programId
  );

  try {
    // 2. CREAR LISTA
    const cuentaExistente = await pg.connection.getAccountInfo(listaPDA);
    if (!cuentaExistente) {
      console.log("📝 Creando nueva lista...");
      await pg.program.methods
        .crearLista("Tareas de Johnny")
        .accounts({
          owner: pg.wallet.publicKey,
          lista: listaPDA,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();
    } else {
      console.log("✅ La lista ya existe, continuando...");
    }

    // 3. AGREGAR TAREA (CREATE)
    console.log("➕ Agregando tarea: 'Estudiar Solana'...");
    await pg.program.methods
      .agregarTarea("Estudiar Solana", 5) // descripcion, prioridad
      .accounts({
        owner: pg.wallet.publicKey,
        lista: listaPDA,
      })
      .rpc();

    // 4. VER TAREAS (READ)
    let datos = await pg.program.account.listaTareas.fetch(listaPDA);
    console.log("\n--- TAREAS (Después de agregar) ---");
    datos.tareas.forEach((t, i) => {
      console.log(`${i + 1}. ${t.descripcion} | Prioridad: ${t.prioridad} | Hecho: ${t.completada}`);
    });

    // 5. ACTUALIZAR TAREA (UPDATE)
    console.log("\n✏️ Actualizando tarea 'Estudiar Solana' (Prioridad 10, Completada: true)...");
    await pg.program.methods
      .actualizarTarea("Estudiar Solana", 10, true)
      .accounts({
        owner: pg.wallet.publicKey,
        lista: listaPDA,
      })
      .rpc();

    // Ver tareas después de actualizar
    datos = await pg.program.account.listaTareas.fetch(listaPDA);
    console.log("--- TAREAS (Después de actualizar) ---");
    datos.tareas.forEach((t, i) => {
      console.log(`${i + 1}. ${t.descripcion} | Prioridad: ${t.prioridad} | Hecho: ${t.completada}`);
    });

    // 6. ELIMINAR TAREA (DELETE)
    console.log("\n🗑️ Eliminando tarea 'Estudiar Solana'...");
    await pg.program.methods
      .eliminarTarea("Estudiar Solana")
      .accounts({
        owner: pg.wallet.publicKey,
        lista: listaPDA,
      })
      .rpc();

    // Ver tareas finales
    datos = await pg.program.account.listaTareas.fetch(listaPDA);
    console.log("--- TAREAS (Después de eliminar) ---");
    if (datos.tareas.length === 0) {
       console.log("La lista está vacía.");
    } else {
       datos.tareas.forEach((t, i) => {
         console.log(`${i + 1}. ${t.descripcion} | Prioridad: ${t.prioridad} | Hecho: ${t.completada}`);
       });
    }

  } catch (error) {
    console.error("❌ Error:", error);
  }
}

runToDoList();
